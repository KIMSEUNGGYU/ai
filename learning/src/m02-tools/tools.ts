/**
 * M02: Tools — 에이전트에게 능력 부여
 *
 * tools 옵션으로 Read, Glob 도구를 부여하고 에이전트의 도구 선택을 관찰
 *
 * 실행: unset CLAUDECODE && npx tsx src/m02-tools/tools.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M02: Tools ===\n");

  let messageCount = 0;

  for await (const message of query({
    prompt: "이 프로젝트의 package.json을 읽고, 설치된 의존성 목록을 알려줘.",
    options: {
      tools: ["Read", "Glob"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    messageCount++;
    const msg = message as any;

    switch (msg.type) {
      case "assistant":
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");
        if (text) console.log(`🤖 [${messageCount}] ${text.slice(0, 200)}`);
        if (toolUses?.length > 0) {
          for (const tu of toolUses) {
            console.log(`🔧 [${messageCount}] tool_use: ${tu.name}(${JSON.stringify(tu.input).slice(0, 100)})`);
          }
        }
        break;

      case "result":
        console.log(`\n✅ [${messageCount}] 최종 결과`);
        console.log(`   result: "${msg.result?.slice(0, 300)}"`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        break;
    }
  }
}

main().catch(console.error);
