/**
 * Step 4 보너스: PreToolUse 차단 실험
 *
 * Read 도구를 차단하고, Claude가 어떻게 반응하는지 관찰한다.
 * Glob은 허용하되 Read는 금지 → "파일 목록은 알지만 내용은 못 읽는" 상태.
 *
 * 실행: unset CLAUDECODE && npx tsx step4-hooks-block.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

// === PreToolUse: Read 차단 ===
async function blockRead(input: any, toolUseID: string | undefined) {
  if (input.tool_name === "Read") {
    console.log(`  🚫 [차단] ${input.tool_name} 호출 거부!`);
    return { blocked: true, reason: "Read 도구는 보안 정책에 의해 차단되었습니다." };
  }
  console.log(`  ✅ [허용] ${input.tool_name}`);
  return {};
}

async function main() {
  console.log("=== Step 4 보너스: PreToolUse 차단 실험 ===\n");
  console.log("📌 규칙: Glob 허용, Read 차단\n");

  let messageCount = 0;

  for await (const message of query({
    prompt: "이 프로젝트의 파일 목록을 확인하고, package.json의 내용을 읽어줘.",
    options: {
      model: "haiku",
      tools: ["Read", "Glob"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      hooks: {
        PreToolUse: [
          { matcher: ".*", hooks: [blockRead] }
        ],
      },
    },
  })) {
    messageCount++;
    const msg = message as any;

    switch (msg.type) {
      case "system":
        console.log(`📦 [${messageCount}] system/${msg.subtype} | tools: ${msg.tools?.length ?? 0}개`);
        break;

      case "assistant": {
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");
        const parts: string[] = [];
        if (text) parts.push(`text: "${text.slice(0, 100)}${text.length > 100 ? "..." : ""}"`);
        if (toolUses?.length > 0) parts.push(`tools: [${toolUses.map((t: any) => t.name).join(", ")}]`);
        console.log(`🤖 [${messageCount}] assistant | ${parts.join(" | ") || "(empty)"}`);
        if (text && text.length > 100) console.log(text);
        break;
      }

      case "user":
        console.log(`👤 [${messageCount}] user (tool_result → Claude에 피드백)`);
        break;

      case "result":
        console.log(`\n✅ [${messageCount}] result/${msg.subtype}`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        console.log(`   result: ${msg.result?.slice(0, 300)}`);
        break;

      default:
        console.log(`⬜ [${messageCount}] ${msg.type}/${msg.subtype ?? ""}`);
    }
  }

  console.log(`\n=== 완료 (총 ${messageCount}개 메시지) ===`);
}

main().catch(console.error);
