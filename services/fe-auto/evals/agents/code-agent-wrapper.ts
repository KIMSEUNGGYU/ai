import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFn } from "@agents/eval";
import {
  createFixtureProject,
  cleanupFixtureProject,
} from "../fixtures/setup.js";

interface CodeInput {
  spec: string;
  projectPath: string;
}

/**
 * eval용 code agent wrapper
 * 원본 runCodeAgent는 FE_WORKFLOW_PLUGIN 의존성이 있어서
 * eval에서는 플러그인 없이 직접 query() 호출
 */
export const codeAgentFn: AgentFn<CodeInput> = async (input) => {
  const fixtureDir = await createFixtureProject();
  console.log(`    [fixture] ${fixtureDir}`);

  try {
    let lastResult = "";
    let cost = 0;

    for await (const message of query({
      prompt: buildEvalCodePrompt(fixtureDir, input.spec),
      options: {
        model: "sonnet" as const,
        permissionMode: "bypassPermissions" as const,
        allowDangerouslySkipPermissions: true,
        systemPrompt: `당신은 FE 코드를 생성하는 전문가입니다.
스펙에 따라 ${fixtureDir}에 React/TS 코드를 생성하세요.
작업 완료 후 생성한 파일 목록과 결과를 보고하세요.`,
      },
    })) {
      const msg = message as any;
      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        cost = msg.total_cost_usd ?? 0;
      }
    }

    return { output: lastResult, costUsd: cost };
  } finally {
    await cleanupFixtureProject(fixtureDir);
    console.log(`    [fixture] cleaned up`);
  }
};

function buildEvalCodePrompt(projectPath: string, spec: string): string {
  return `아래 스펙에 따라 ${projectPath}에 FE 코드를 생성하세요.

## 스펙
${spec}

## 작업 순서
1. 스펙에 정의된 폴더 구조대로 파일 생성
2. models/ → DTO 타입 정의
3. remotes/ → API 함수
4. queries/ → queryOptions 팩토리
5. 페이지 컴포넌트 구현
6. 결과 보고 (생성 파일 목록)`;
}
