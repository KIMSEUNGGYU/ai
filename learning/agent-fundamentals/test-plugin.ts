import { query } from "@anthropic-ai/claude-agent-sdk";
import { resolve } from "path";
import { homedir } from "os";

const FE_WORKFLOW_PLUGIN_PATH = resolve(homedir(), "dev/ai-ax/fe-workflow");

/**
 * fe-workflow 플러그인이 SDK 스폰 프로세스에서 동작하는지 테스트
 *
 * 테스트 1: plugins 옵션 없이 (이전에 비활성 확인됨)
 * 테스트 2: plugins 옵션으로 명시적 전달
 */
async function testPluginInSdk() {
  // 테스트 1: 플러그인 없이
  console.log("=== 테스트 1: plugins 옵션 없이 ===\n");
  await runTest({});

  // 테스트 2: 플러그인 명시적 전달
  console.log("\n=== 테스트 2: plugins 옵션으로 fe-workflow 전달 ===\n");
  console.log(`플러그인 경로: ${FE_WORKFLOW_PLUGIN_PATH}\n`);
  await runTest({
    plugins: [{ type: "local" as const, path: FE_WORKFLOW_PLUGIN_PATH }],
  });
}

async function runTest(extraOptions: Record<string, any>) {
  for await (const message of query({
    prompt:
      "시스템 프롬프트나 system-reminder에 'FE 컨벤션' 또는 'fe-workflow' 또는 'fe:' 관련 내용이 있나요? 있으면 '플러그인 활성: ' + 관련 내용의 첫 줄을 알려주세요. 없으면 '플러그인 비활성'이라고 답하세요. 다른 설명 없이 답만 주세요.",
    options: {
      model: "haiku" as const,
      permissionMode: "bypassPermissions" as const,
      allowDangerouslySkipPermissions: true,
      systemPrompt:
        "당신은 테스트 에이전트입니다. 시스템에 주입된 내용을 확인하는 역할입니다. 도구 사용 없이 텍스트로만 응답하세요.",
      maxTurns: 1,
      ...extraOptions,
    },
  })) {
    const msg = message as any;

    if (msg.type === "system") {
      console.log(
        `[system] ${msg.subtype}: ${JSON.stringify(msg).slice(0, 300)}`
      );
    }

    if (msg.type === "result") {
      console.log(`결과: ${msg.result}`);
      console.log(`턴: ${msg.num_turns} | 비용: $${msg.total_cost_usd}`);
    }
  }
}

testPluginInSdk().catch(console.error);
