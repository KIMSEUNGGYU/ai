/**
 * Step 3: System Prompt — 역할 정의
 *
 * 같은 도구(Read, Glob, Grep)를 줘도
 * systemPrompt에 따라 완전히 다른 행동을 하는 것을 관찰한다.
 *
 * 실행: unset CLAUDECODE && npx tsx step3-prompt.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 3: 코드 리뷰어 에이전트 ===\n");

  let messageCount = 0;

  for await (const message of query({
    prompt: "step1-hello.ts 파일을 리뷰해줘.",
    options: {
      model: "haiku",
      systemPrompt: `당신은 시니어 TypeScript 코드 리뷰어입니다.
코드를 읽고 다음 관점에서 리뷰하세요:
1. 에러 핸들링이 적절한가?
2. 타입 안전성은 확보되었는가?
3. 개선 제안 (구체적 코드 포함)

리뷰 결과를 마크다운 형식으로 출력하세요.`,
      tools: ["Read", "Glob", "Grep"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
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
        if (text) parts.push(`text: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}"`);
        if (toolUses?.length > 0) parts.push(`tools: [${toolUses.map((t: any) => t.name).join(", ")}]`);
        console.log(`🤖 [${messageCount}] assistant | ${parts.join(" | ") || "(empty)"}`);
        if (text && text.length > 80) console.log(text);
        break;
      }

      case "user":
        console.log(`👤 [${messageCount}] user (tool_result → Claude에 피드백)`);
        break;

      case "result":
        console.log(`\n✅ [${messageCount}] result/${msg.subtype}`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        break;

      default:
        console.log(`⬜ [${messageCount}] ${msg.type}/${msg.subtype ?? ""}`);
    }
  }

  console.log(`\n=== 완료 (총 ${messageCount}개 메시지) ===`);
}

main().catch(console.error);
