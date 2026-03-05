import type { AgentFn } from "@agents/eval";
import { runCodeAgent } from "../../agents/code-agent.js";
import {
  createFixtureProject,
  cleanupFixtureProject,
} from "../fixtures/setup.js";

interface CodeInput {
  spec: string;
  projectPath: string;
}

export const codeAgentFn: AgentFn<CodeInput> = async (input) => {
  // 임시 프로젝트 생성
  const fixtureDir = await createFixtureProject();
  console.log(`    [fixture] ${fixtureDir}`);

  try {
    const result = await runCodeAgent(
      {
        specPath: "eval-inline",
        projectPath: fixtureDir,
      },
      input.spec
    );
    return {
      output: result.output,
      costUsd: result.cost,
    };
  } finally {
    // 임시 프로젝트 정리
    await cleanupFixtureProject(fixtureDir);
    console.log(`    [fixture] cleaned up`);
  }
};
