import { query } from "@anthropic-ai/claude-agent-sdk";
import { FE_WORKFLOW_PLUGIN } from "../conventions.js";
import type { AgentResult, DualReviewInput } from "../types.js";

const MAX_RETRIES = 3;

export async function runImplAgent(
  input: DualReviewInput,
  designSpec: string,
  reviewFeedback?: string
): Promise<AgentResult> {
  console.log("\n[Impl Agent] 구현 시작\n");

  let sessionId: string | undefined;
  let lastResult = "";
  let turns = 0;
  let cost = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      isFirst
        ? "  설계 기반 코드 생성 중..."
        : `  수정 중 (${attempt}/${MAX_RETRIES})...`
    );

    for await (const message of query({
      prompt: isFirst
        ? buildImplPrompt(input, designSpec, reviewFeedback)
        : lastResult,
      options: {
        model: "sonnet" as const,
        permissionMode: "bypassPermissions" as const,
        allowDangerouslySkipPermissions: true,
        systemPrompt: buildImplSystemPrompt(input.targetProject),
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

    // 빌드/타입 에러 검증
    const hasBuildError = /error TS\d+|build failed|compilation error/i.test(
      lastResult
    );
    const hasTypeError =
      /type.*error|cannot find.*module|is not assignable/i.test(lastResult);
    const filesCreated = /생성|created|wrote|파일/i.test(lastResult);

    if (!hasBuildError && !hasTypeError && filesCreated) {
      console.log("  구현 완료!\n");
      return { output: lastResult, sessionId, turns, cost };
    }

    if (attempt < MAX_RETRIES) {
      const issues: string[] = [];
      if (hasBuildError) issues.push("빌드 에러");
      if (hasTypeError) issues.push("타입 에러");
      if (!filesCreated) issues.push("파일 생성 미확인");
      console.log(`  문제: ${issues.join(", ")}. 수정 요청...\n`);
      lastResult = `코드에 문제가 있습니다: ${issues.join(", ")}. 에러를 수정하세요.`;
    }
  }

  console.log("  최대 재시도 도달.\n");
  return { output: lastResult, sessionId, turns, cost };
}

function buildImplPrompt(
  input: DualReviewInput,
  designSpec: string,
  reviewFeedback?: string
): string {
  let prompt = `아래 설계에 따라 ${input.targetProject}에 FE 코드를 구현하세요.

## 원본 요구사항
${input.requirement}

## 설계 산출물 (Design Agent가 작성)
${designSpec}

## 작업 순서
1. 설계의 파일 구조대로 파일 생성
2. 타입/인터페이스 정의부터
3. API 레이어 (remotes → queries → mutations)
4. 컴포넌트 구현
5. tsc --noEmit 으로 타입 체크
6. 결과 보고 (생성/수정 파일 목록, 에러 여부)

## 주의사항
- 설계 산출물의 구현 지시사항을 정확히 따르세요
- 설계에 명시된 컨벤션 준수 사항을 반드시 지키세요
- 설계에 없는 것은 구현하지 마세요`;

  if (reviewFeedback) {
    prompt += `\n\n## Codex 리뷰 피드백 (반드시 반영)
${reviewFeedback}`;
  }

  return prompt;
}

function buildImplSystemPrompt(targetProject: string): string {
  return `당신은 사내 FE 프로젝트의 코드를 구현하는 전문가입니다.

## 역할
Design Agent의 설계 산출물을 받아 ${targetProject}에 실제 코드를 구현합니다.

## 핵심 원칙
- 설계 산출물을 정확히 따르세요 (임의 변경 금지)
- 기존 프로젝트의 패턴을 참고하세요
- 시스템에 주입된 FE 컨벤션을 준수하세요
- 구현 후 반드시 tsc --noEmit 실행

## 작업 완료 후
- 생성/수정한 파일 목록 보고
- 에러가 있으면 직접 수정
- git diff 내용 보고`;
}
