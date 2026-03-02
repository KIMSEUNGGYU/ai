/**
 * M07: Subagents — 작업 위임과 병렬 처리
 *
 * 커스텀 서브에이전트를 정의하고 코드 리뷰를 위임
 *
 * 실행: unset CLAUDECODE && npx tsx src/m07-subagents/subagents.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M07: Subagents ===\n");

  for await (const message of query({
    prompt: `src/m01-hello/hello.ts 파일을 code-reviewer 에이전트를 사용해서 리뷰해줘.`,
    options: {
      tools: ["Read", "Glob", "Grep"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      agents: {
        "code-reviewer": {
          description: "TypeScript 코드를 리뷰합니다. 코드 품질, 에러 핸들링, 타입 안전성을 분석합니다.",
          prompt: `당신은 TypeScript 코드 리뷰어입니다.
파일을 읽고 다음을 분석하세요:
1. 코드 품질 (가독성, 구조)
2. 에러 핸들링
3. 개선 제안
결과를 3줄 이내로 요약하세요.`,
          tools: ["Read", "Glob", "Grep"],
        },
        "security-checker": {
          description: "보안 취약점을 분석합니다. OWASP Top 10 기준.",
          prompt: `보안 감사자. OWASP Top 10 기준으로 잠재 취약점 분석. 심각도 등급 표시.`,
          tools: ["Read", "Glob", "Grep"],
        },
      },
    },
  })) {
    const msg = message as any;

    switch (msg.type) {
      case "assistant":
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");
        if (text) console.log(`🤖 ${text.slice(0, 300)}`);
        if (toolUses?.length > 0) {
          for (const tu of toolUses) {
            console.log(`🔧 ${tu.name}(${JSON.stringify(tu.input).slice(0, 80)})`);
          }
        }
        break;

      case "result":
        console.log(`\n✅ result: ${msg.result?.slice(0, 300)}`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        break;
    }
  }
}

main().catch(console.error);
