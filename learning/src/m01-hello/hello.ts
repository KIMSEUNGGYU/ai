/**
 * M01: Hello Agent — 가장 단순한 에이전트
 *
 * query() 호출 → 에이전트 루프 시작 → 메시지 스트리밍 관찰
 *
 * 실행: unset CLAUDECODE && npx tsx src/m01-hello/hello.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M01: Hello World Agent ===\n");

  let messageCount = 0;

  for await (const message of query({
    prompt: "What is 2 + 2? Answer in one sentence.",
    options: {
      tools: [],  // tools: [] → 빌트인 도구 비활성화 (순수 LLM 모드)
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    messageCount++;
    const msg = message as any;

    switch (msg.type) {
      case "system":
        console.log(`📦 [${messageCount}] system/${msg.subtype}`);
        console.log(`   session_id: ${msg.session_id}`);
        console.log(`   tools: ${msg.tools?.length ?? 0}개`);
        if (msg.tools?.length > 0) {
          console.log(`   도구 목록 (처음 5개): ${msg.tools.slice(0, 5).join(", ")}`);
        }
        break;

      case "assistant":
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content?.filter((c: any) => c.type === "tool_use");
        console.log(`🤖 [${messageCount}] assistant`);
        console.log(`   model: ${msg.message?.model}`);
        if (text) console.log(`   text: "${text}"`);
        if (toolUses?.length > 0) console.log(`   tool_use: ${toolUses.length}개`);
        break;

      case "tool_result":
        console.log(`🔧 [${messageCount}] tool_result`);
        break;

      case "result":
        console.log(`✅ [${messageCount}] result/${msg.subtype}`);
        console.log(`   result: "${msg.result}"`);
        console.log(`   duration: ${msg.duration_ms}ms (API: ${msg.duration_api_ms}ms)`);
        console.log(`   turns: ${msg.num_turns}`);
        console.log(`   cost: $${msg.total_cost_usd}`);
        break;

      default:
        console.log(`⬜ [${messageCount}] ${msg.type}`);
    }
    console.log("---");
  }

  console.log(`\n=== 완료 (총 ${messageCount}개 메시지) ===`);
}

main().catch(console.error);
