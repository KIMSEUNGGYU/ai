import { query } from "@anthropic-ai/claude-agent-sdk";
import { evaluateReview } from "../evaluators/review-eval.js";
import { FE_WORKFLOW_PLUGIN } from "../conventions.js";
import type { AgentResult } from "../types.js";

const MAX_RETRIES = 2;

export async function runReviewAgent(
  projectPath: string,
  spec: string,
  codeOutput: string
): Promise<AgentResult> {
  console.log("\n[Review Agent] 코드 리뷰 시작\n");

  let sessionId: string | undefined;
  let lastResult = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      isFirst
        ? "  FE 컨벤션 기반 리뷰 중..."
        : `  재리뷰 중 (${attempt}/${MAX_RETRIES})...`
    );

    let turns = 0;
    let cost = 0;

    for await (const message of query({
      prompt: isFirst
        ? buildReviewPrompt(projectPath, spec, codeOutput)
        : lastResult,
      options: {
        model: "haiku" as const,
        permissionMode: "bypassPermissions" as const,
        allowDangerouslySkipPermissions: true,
        systemPrompt: REVIEW_SYSTEM_PROMPT,
        plugins: [FE_WORKFLOW_PLUGIN],
        ...(isFirst ? {} : { resume: sessionId }),
      },
    })) {
      const msg = message as any;

      if (msg.type === "system" && msg.subtype === "init" && !sessionId) {
        sessionId = msg.session_id;
      }

      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        turns = msg.num_turns ?? 0;
        cost = msg.total_cost_usd ?? 0;
        console.log(`    턴: ${turns} | 비용: $${cost}`);
      }
    }

    // 평가
    console.log("\n  리뷰 결과 평가 중...");
    const evaluation = evaluateReview(lastResult);

    if (evaluation.pass) {
      console.log("  리뷰 통과!\n");
      return { output: lastResult, sessionId, turns, cost };
    }

    if (attempt < MAX_RETRIES) {
      console.log(`  문제: ${evaluation.feedback}\n`);
      lastResult = `리뷰에서 문제가 발견되었습니다. 해당 파일들을 수정해주세요.\n\n${evaluation.feedback}\n\n수정 후 다시 리뷰하겠습니다.`;
    } else {
      console.log("  최대 재시도 도달.\n");
    }
  }

  return { output: lastResult, sessionId, turns: 0, cost: 0 };
}

function buildReviewPrompt(
  projectPath: string,
  spec: string,
  codeOutput: string
): string {
  return `${projectPath}에 생성된 코드를 리뷰하세요.

## 원본 스펙
${spec}

## 생성된 코드 정보
${codeOutput}

## 리뷰 기준
시스템에 주입된 FE 컨벤션을 기준으로 리뷰하세요.
각 이슈에 심각도를 표시하세요: CRITICAL / HIGH / MEDIUM / LOW
이슈가 없으면 "리뷰 통과. 이슈 없음." 출력.`;
}

const REVIEW_SYSTEM_PROMPT = `당신은 사내 FE 프로젝트의 코드 리뷰 전문가입니다.

## 역할
생성된 코드가 스펙과 FE 컨벤션을 충족하는지 리뷰합니다.
시스템에 주입된 FE 컨벤션을 리뷰 기준으로 사용하세요.

## 출력 형식
각 이슈를 아래 형식으로:
- [CRITICAL/HIGH/MEDIUM/LOW] {파일}:{라인} — {설명}

이슈가 없으면 "리뷰 통과. 이슈 없음." 출력.

## 판단 기준
- CRITICAL: 컨벤션 핵심 규칙 위반 (interface/type 혼용, 직접 fetch, mutate 콜백 패턴)
- HIGH: 패턴 불일치 (queryKey 비계층적, staleTime 미설정, 명령형 로딩 분기)
- MEDIUM: 스타일 이슈 (네이밍, 폴더 위치)
- LOW: 개선 제안`;
