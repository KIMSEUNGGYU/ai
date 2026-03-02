/**
 * M10: Streaming & User Input — 대화형 에이전트
 *
 * 스트리밍 메시지를 실시간 처리하고 진행 상황을 표시
 *
 * 실행: unset CLAUDECODE && npx tsx src/m10-streaming/streaming.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M10: Streaming & User Input ===\n");

  let toolCallCount = 0;

  for await (const message of query({
    prompt: "이 프로젝트의 src/ 폴더 구조를 파악하고, 각 모듈의 역할을 설명해줘.",
    options: {
      tools: ["Read", "Glob"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    const msg = message as any;

    switch (msg.type) {
      case "system":
        console.log("🚀 에이전트 시작...\n");
        break;

      case "assistant":
        const toolUses = msg.message?.content?.filter((c: any) => c.type === "tool_use");
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");

        if (toolUses?.length) {
          for (const tu of toolUses) {
            toolCallCount++;
            console.log(`  ⏳ [${toolCallCount}] ${tu.name} 실행 중...`);
          }
        }
        if (text) console.log(`\n🤖 ${text}`);
        break;

      case "result":
        console.log(`\n${"─".repeat(40)}`);
        console.log(`✅ 완료!`);
        console.log(`   도구 호출: ${toolCallCount}회`);
        console.log(`   turns: ${msg.num_turns}`);
        console.log(`   cost: $${msg.total_cost_usd}`);
        break;
    }
  }
}

main().catch(console.error);
