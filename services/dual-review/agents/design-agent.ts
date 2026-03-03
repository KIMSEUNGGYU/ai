import { query } from "@anthropic-ai/claude-agent-sdk";
import { FE_WORKFLOW_PLUGIN } from "../conventions.js";
import type { AgentResult, DualReviewInput } from "../types.js";

const MAX_RETRIES = 2;

export async function runDesignAgent(
  input: DualReviewInput
): Promise<AgentResult> {
  console.log("\n[Design Agent] 설계 시작\n");

  let sessionId: string | undefined;
  let lastResult = "";
  let turns = 0;
  let cost = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      isFirst
        ? "  컨벤션 기반 설계 중..."
        : `  설계 보완 중 (${attempt}/${MAX_RETRIES})...`
    );

    for await (const message of query({
      prompt: isFirst
        ? buildDesignPrompt(input)
        : buildRetryPrompt(lastResult),
      options: {
        model: "opus" as const,
        permissionMode: "bypassPermissions" as const,
        allowDangerouslySkipPermissions: true,
        systemPrompt: buildDesignSystemPrompt(input.targetProject),
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

    // 설계 산출물 핵심 섹션 검증
    const hasComponents = /컴포넌트|component/i.test(lastResult);
    const hasFiles = /파일|file|폴더|directory/i.test(lastResult);
    const hasInstructions = /구현|implement|지시|instruction/i.test(lastResult);

    if (hasComponents && hasFiles && hasInstructions) {
      console.log("  설계 완료!\n");
      return { output: lastResult, sessionId, turns, cost };
    }

    if (attempt < MAX_RETRIES) {
      console.log("  설계 산출물 불충분, 보완 요청...\n");
    }
  }

  console.log("  최대 재시도 도달. 현재 결과로 진행.\n");
  return { output: lastResult, sessionId, turns, cost };
}

function buildRetryPrompt(lastResult: string): string {
  const missing: string[] = [];
  if (!/컴포넌트|component/i.test(lastResult)) missing.push("컴포넌트 구조");
  if (!/파일|file|폴더|directory/i.test(lastResult)) missing.push("파일 구조");
  if (!/구현|implement|지시|instruction/i.test(lastResult))
    missing.push("구현 지시사항");
  return `설계에 다음 섹션이 누락되었습니다: ${missing.join(", ")}. 해당 섹션을 추가해주세요.`;
}

function buildDesignPrompt(input: DualReviewInput): string {
  return `아래 요구사항에 대해 ${input.targetProject} 프로젝트의 FE 설계를 해주세요.

## 요구사항
${input.requirement}

## 작업 순서
1. 대상 프로젝트(${input.targetProject})의 기존 구조 탐색
2. 유사한 기존 기능/페이지 패턴 파악
3. 시스템에 주입된 FE 컨벤션 확인
4. 컴포넌트 분해 & 파일 구조 설계
5. 타입/인터페이스 정의
6. 구현 에이전트가 따를 수 있는 상세 구현 지시사항 작성

## 출력 형식
아래 섹션을 모두 포함해주세요:

### 1. 컴포넌트 구조
- 생성할 컴포넌트 목록과 역할

### 2. 파일 구조
- 생성/수정할 파일 경로와 각 파일의 역할

### 3. 타입/인터페이스
- 필요한 타입 정의 (코드 블록)

### 4. 구현 지시사항
- 구현 순서
- 각 파일에서 해야 할 작업
- 컨벤션 준수 사항 (구체적으로)
- 주의사항

## 주의사항
- 기존 프로젝트 패턴을 반드시 따르세요
- 이른 추상화 금지 — Page First 원칙
- 스펙에 없는 것은 설계하지 마세요`;
}

function buildDesignSystemPrompt(targetProject: string): string {
  return `당신은 사내 FE 프로젝트의 설계 전문가입니다.

## 역할
요구사항을 받아 FE 프로젝트(${targetProject})에 맞는 설계 산출물을 작성합니다.
구현 에이전트가 이 산출물만 보고 코드를 생성할 수 있을 정도로 상세해야 합니다.

## 핵심 원칙
- 기존 프로젝트의 패턴을 먼저 파악하고 따르세요
- 시스템에 주입된 FE 컨벤션을 반드시 준수하세요
- YAGNI — 요구사항에 없는 것은 설계하지 마세요
- 컴포넌트, 파일 구조, 타입, 구현 지시를 모두 포함하세요`;
}
