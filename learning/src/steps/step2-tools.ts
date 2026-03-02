/**
 * Step 2: Tools — 에이전트에게 능력 부여
 *
 * Step 1에서는 tools: [] → 루프 1턴에 종료.
 * 이번엔 Read, Glob 도구를 부여해서 루프가 여러 턴으로 확장되는 것을 관찰.
 *
 * 관찰 포인트:
 * - tool_use 메시지가 나타나는가?
 * - Claude가 어떤 도구를 선택했는가?
 * - num_turns가 1보다 큰가?
 *
 * 실행: unset CLAUDECODE && npx tsx step2-tools.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 2: Tools — 에이전트에게 능력 부여 ===\n");

  let messageCount = 0;

  for await (const message of query({
    prompt: "이 프로젝트의 package.json을 읽고, 설치된 의존성 목록을 알려줘.",
    options: {
      model: "haiku",                // 비용 절약: Opus $0.33 → Haiku ~$0.01
      tools: ["Read", "Glob"],       // 파일 읽기 + 검색 능력 부여
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    messageCount++;
    const msg = message as any;

    switch (msg.type) {
      case "system":
        console.log(`📦 [${messageCount}] system/${msg.subtype}`);
        console.log(`   tools: ${msg.tools?.length ?? 0}개`);
        if (msg.tools?.length > 0) {
          console.log(`   도구 목록: ${msg.tools.join(", ")}`);
        }
        break;

      case "assistant":
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");

        if (text) console.log(`🤖 [${messageCount}] ${text.slice(0, 300)}`);
        if (toolUses?.length > 0) {
          for (const tu of toolUses) {
            console.log(`🔧 [${messageCount}] tool_use: ${tu.name}(${JSON.stringify(tu.input).slice(0, 150)})`);
          }
        }
        break;

      case "tool_result":
        console.log(`📋 [${messageCount}] tool_result (결과 수신)`);
        break;

      case "result":
        console.log(`\n✅ [${messageCount}] 최종 결과`);
        console.log(`   result: "${msg.result?.slice(0, 400)}"`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        console.log(`   duration: ${msg.duration_ms}ms`);
        break;

      default:
        console.log(`⬜ [${messageCount}] ${msg.type}`);
    }
    console.log("---");
  }

  console.log(`\n=== 완료 (총 ${messageCount}개 메시지) ===`);
}

main().catch(console.error);
