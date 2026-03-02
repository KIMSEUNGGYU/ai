/**
 * M03: System Prompt — 역할 정의
 *
 * systemPrompt로 코드 리뷰어 에이전트를 만들고 행동 변화를 관찰
 *
 * 실행: unset CLAUDECODE && npx tsx src/m03-prompt/prompt.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M03: 코드 리뷰어 에이전트 ===\n");

  for await (const message of query({
    prompt: "src/m01-hello/hello.ts 파일을 리뷰해줘.",
    options: {
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
    const msg = message as any;
    if (msg.type === "assistant") {
      const text = msg.message?.content
        ?.filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      if (text) console.log(text);
    }
    if (msg.type === "result") {
      console.log(`\n--- cost: $${msg.total_cost_usd} | turns: ${msg.num_turns} ---`);
    }
  }
}

main().catch(console.error);
