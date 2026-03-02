/**
 * M04: Permissions — 권한과 안전장치
 *
 * disallowedTools로 Bash를 차단하고 에이전트의 반응을 관찰
 *
 * 실행: unset CLAUDECODE && npx tsx src/m04-permissions/permissions.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M04: Permissions ===\n");

  for await (const message of query({
    prompt: "package.json을 읽고 설명해줘. 가능하면 npm audit도 실행해줘.",
    options: {
      tools: ["Read", "Glob", "Bash"],
      disallowedTools: ["Bash"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    const msg = message as any;
    if (msg.type === "assistant") {
      const text = msg.message?.content
        ?.filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      const toolUses = msg.message?.content
        ?.filter((c: any) => c.type === "tool_use");
      if (text) console.log(`🤖 ${text.slice(0, 300)}`);
      if (toolUses?.length > 0) {
        for (const tu of toolUses) {
          console.log(`🔧 tool_use: ${tu.name}(${JSON.stringify(tu.input).slice(0, 80)})`);
        }
      }
    }
    if (msg.type === "result") {
      console.log(`\n✅ turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
    }
  }
}

main().catch(console.error);
