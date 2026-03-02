/**
 * Step 1: Hello World — 가장 단순한 에이전트
 *
 * 이 파일은 Agent Harness의 가장 기본 형태:
 * - query() 호출 → 에이전트 루프 시작
 * - 메시지 스트리밍 → 각 메시지 타입 관찰
 *
 * 실행: npx tsx step1-hello.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 1: Hello World Agent ===\n");

  // query()가 하네스의 핵심 — 에이전트 루프를 시작하고 메시지를 스트리밍
  let messageCount = 0;

  for await (const message of query({
    prompt: "What is 2 + 2? Answer in one sentence.",
    options: {
      tools: [],  // tools: [] → 사용 가능한 도구 없음 (allowedTools와 다름!)
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,  // bypassPermissions 사용 시 필수
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
