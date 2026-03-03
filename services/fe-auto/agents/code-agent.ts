import { query } from "@anthropic-ai/claude-agent-sdk";
import { evaluateCode } from "../evaluators/code-eval.js";
import { FE_WORKFLOW_PLUGIN } from "../conventions.js";
import type { AgentResult, FeAutoInput } from "../types.js";

const MAX_RETRIES = 5;

export async function runCodeAgent(
  input: FeAutoInput,
  spec: string,
  reviewFeedback?: string
): Promise<AgentResult> {
  console.log("\n[Code Agent] 코드 생성 시작\n");

  let sessionId: string | undefined;
  let lastResult = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      isFirst
        ? "  스펙 기반 코드 생성 중..."
        : `  수정 중 (${attempt}/${MAX_RETRIES})...`
    );

    let turns = 0;
    let cost = 0;

    for await (const message of query({
      prompt: isFirst
        ? buildCodePrompt(input, spec, reviewFeedback)
        : lastResult,
      options: {
        model: "sonnet" as const,
        permissionMode: "bypassPermissions" as const,
        allowDangerouslySkipPermissions: true,
        systemPrompt: buildCodeSystemPrompt(input.projectPath),
        plugins: [FE_WORKFLOW_PLUGIN],
        ...(isFirst ? {} : { resume: sessionId }),
      },
    })) {
      const msg = message as any;

      if (msg.type === "system" && msg.subtype === "init" && !sessionId) {
        sessionId = msg.session_id;
      }

      if (msg.type === "assistant") {
        const toolUses = msg.message?.content?.filter(
          (c: any) => c.type === "tool_use"
        );
        if (toolUses?.length) {
          for (const t of toolUses) {
            console.log(`    도구: ${t.name}`);
          }
        }
      }

      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        turns = msg.num_turns ?? 0;
        cost = msg.total_cost_usd ?? 0;
        console.log(`    턴: ${turns} | 비용: $${cost}`);
      }
    }

    // 평가
    console.log("\n  코드 평가 중...");
    const evaluation = evaluateCode(lastResult);

    if (evaluation.pass) {
      console.log("  코드 생성 완료!\n");
      return { output: lastResult, sessionId, turns, cost };
    }

    if (attempt < MAX_RETRIES) {
      console.log(`  문제: ${evaluation.feedback}\n`);
      lastResult = evaluation.feedback;
    } else {
      console.log("  최대 재시도 도달.\n");
    }
  }

  return { output: lastResult, sessionId, turns: 0, cost: 0 };
}

function buildCodePrompt(
  input: FeAutoInput,
  spec: string,
  reviewFeedback?: string
): string {
  let prompt = `아래 스펙에 따라 ${input.projectPath}에 FE 코드를 생성하세요.

## 스펙 (내가 작성한 문서)
${spec}

## 작업 순서
1. 프로젝트에서 유사한 페이지/기능을 찾아 패턴 파악
2. 스펙에 정의된 폴더 구조대로 파일 생성
3. models/ → DTO 타입 정의
4. remotes/ → API 함수 (httpClient, *Params 객체)
5. queries/ → queryOptions 팩토리 (queryKey 계층적)
6. mutations/ → mutationOptions 팩토리 (onSuccess → invalidateQueries)
7. 페이지 컴포넌트 구현 (useSuspenseQuery, Suspense/ErrorBoundary)
8. tsc --noEmit 으로 타입 체크
9. 결과 보고 (생성 파일 목록, 에러 여부)

## 주의사항
- 기존 프로젝트의 패턴을 반드시 참고하세요 (유사 페이지 확인)
- FE 컨벤션은 시스템에 주입된 내용을 따르세요
- 새 파일은 페이지 로컬에서 시작 (Page First 원칙)
- 이른 추상화 금지 — 재사용 전까지 인라인`;

  if (reviewFeedback) {
    prompt += `\n\n## 이전 리뷰 피드백 (반드시 반영)
${reviewFeedback}`;
  }

  return prompt;
}

function buildCodeSystemPrompt(projectPath: string): string {
  return `당신은 사내 FE 프로젝트의 코드를 생성하는 전문가입니다.

## 핵심 원칙
- 기존 프로젝트(${projectPath})의 패턴을 먼저 파악하고 따르세요
- 시스템에 주입된 FE 컨벤션을 반드시 준수하세요
- 스펙에 없는 것은 구현하지 마세요
- UI 배치/스켈레톤이 이미 있으면 그 위에 로직/API만 채우세요

## 작업 완료 후
- tsc --noEmit 실행
- 생성한 파일 목록 보고
- 에러가 있으면 직접 수정`;
}
