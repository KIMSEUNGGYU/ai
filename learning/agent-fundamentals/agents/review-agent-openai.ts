import { Codex, type Thread } from "@openai/codex-sdk";
import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { evaluateReview } from "../evaluators/review-eval.js";
import type { AgentResult } from "../types.js";

const MAX_RETRIES = 2;

/**
 * OpenAI Codex SDK 기반 리뷰 에이전트.
 * Claude 리뷰 에이전트와 동일한 AgentResult 인터페이스를 반환한다.
 *
 * Claude Agent SDK와의 구조 비교:
 * - Claude: query() → Claude Code CLI 서브프로세스
 * - Codex:  Codex.startThread().run() → Codex CLI 서브프로세스
 * - 둘 다 구독 기반 인증 (API 키 불요)
 */
export async function runReviewAgentOpenAI(
  projectPath: string,
  spec: string,
  codeOutput: string
): Promise<AgentResult> {
  console.log("\n[Review Agent (Codex)] 코드 리뷰 시작\n");

  const codex = new Codex();
  const conventions = loadConventions();
  const prompt = buildReviewPrompt(conventions, projectPath, spec, codeOutput);

  let threadId: string | null = null;
  let lastResult = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      isFirst
        ? "  Codex 기반 리뷰 중..."
        : `  재리뷰 중 (${attempt}/${MAX_RETRIES})...`
    );

    // 첫 시도: 새 스레드, 재시도: 기존 스레드 이어서
    const threadOptions = { sandboxMode: "read-only" as const, approvalPolicy: "never" as const };
    const thread: Thread = isFirst
      ? codex.startThread(threadOptions)
      : codex.resumeThread(threadId!, threadOptions);

    const input = isFirst
      ? prompt
      : `리뷰에서 문제가 발견되었습니다. 다시 리뷰해주세요.\n\n${lastResult}`;

    const turn = await thread.run(input);

    // 스레드 ID 캡처 (최초 1회)
    if (!threadId) {
      threadId = thread.id;
    }

    // 결과 추출
    lastResult = turn.finalResponse;
    if (turn.usage) {
      totalInputTokens += turn.usage.input_tokens;
      totalOutputTokens += turn.usage.output_tokens;
    }

    console.log(
      `    토큰: input=${turn.usage?.input_tokens ?? 0} output=${turn.usage?.output_tokens ?? 0}`
    );

    // 평가
    console.log("\n  리뷰 결과 평가 중...");
    const evaluation = evaluateReview(lastResult);

    if (evaluation.pass) {
      console.log("  리뷰 통과!\n");
      return {
        output: lastResult,
        sessionId: threadId ?? undefined,
        turns: attempt + 1,
        cost: 0, // Codex는 구독 기반이라 별도 비용 없음
      };
    }

    if (attempt < MAX_RETRIES) {
      console.log(`  문제: ${evaluation.feedback}\n`);
    } else {
      console.log("  최대 재시도 도달.\n");
    }
  }

  return {
    output: lastResult,
    sessionId: threadId ?? undefined,
    turns: MAX_RETRIES + 1,
    cost: 0,
  };
}

// ── FE 컨벤션 로드 ──

function loadConventions(): string {
  const conventionsDir = resolve(
    homedir(),
    "dev/ai-ax/fe-workflow/conventions"
  );

  try {
    const files = ["api-layer.md", "code-principles.md"];
    return files
      .map((f) => {
        try {
          return readFileSync(resolve(conventionsDir, f), "utf-8");
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join("\n\n---\n\n");
  } catch {
    return "(FE 컨벤션 로드 실패)";
  }
}

// ── 프롬프트 구성 ──

function buildReviewPrompt(
  conventions: string,
  projectPath: string,
  spec: string,
  codeOutput: string
): string {
  return `당신은 사내 FE 프로젝트의 코드 리뷰 전문가입니다.

## 역할
생성된 코드가 스펙과 FE 컨벤션을 충족하는지 리뷰합니다.

## FE 컨벤션
${conventions}

## 리뷰 대상
${projectPath}에 생성된 코드를 리뷰하세요.

### 원본 스펙
${spec}

### 생성된 코드 정보
${codeOutput}

## 출력 형식
각 이슈를 아래 형식으로:
- [CRITICAL/HIGH/MEDIUM/LOW] {파일}:{라인} — {설명}

이슈가 없으면 "리뷰 통과. 이슈 없음." 출력.

## 판단 기준
- CRITICAL: 컨벤션 핵심 규칙 위반 (interface/type 혼용, 직접 fetch, mutate 콜백 패턴)
- HIGH: 패턴 불일치 (queryKey 비계층적, staleTime 미설정, 명령형 로딩 분기)
- MEDIUM: 스타일 이슈 (네이밍, 폴더 위치)
- LOW: 개선 제안`;
}
