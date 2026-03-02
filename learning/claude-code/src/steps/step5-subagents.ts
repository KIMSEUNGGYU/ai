/**
 * Step 5: Subagents — 병렬 코드 분석
 *
 * 커스텀 서브에이전트 code-reviewer를 정의하고,
 * 메인 에이전트가 서브에이전트에게 파일 리뷰를 위임하는 과정을 관찰한다.
 *
 * 실행: unset CLAUDECODE && npx tsx step5-subagents.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 5: Sub노 agents ===\n");

  let messageCount = 0;

  for await (const message of query({
    prompt: `이 프로젝트의 step1-hello.ts 파일을
code-reviewer 에이전트를 사용해서 리뷰해줘.`,
    options: {
      model: "haiku",
      // tools 제한을 풀어서 Agent 도구도 사용 가능하게
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      agents: {
        "code-reviewer": {
          description: "TypeScript 코드를 리뷰합니다.",
          prompt: `당신은 TypeScript 코드 리뷰어입니다.
파일을 읽고 다음을 분석하세요:
1. 코드 품질 (가독성, 구조)
2. 에러 핸들링
3. 개선 제안
결과를 3줄 이내로 요약하세요.`,
          tools: ["Read", "Glob", "Grep"],
        },
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
          const content = JSON.stringify(msg.message?.content ?? msg).slice(0, 200);
          console.log(`👤 [${messageCount}] user | ${content}`);
          break;
        // console.log(`👤 [${messageCount}] user (tool_result → Claude에 피드백)`);
        // break;

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
