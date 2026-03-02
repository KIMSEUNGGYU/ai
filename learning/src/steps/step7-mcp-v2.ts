import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 7-v2: 복합 MCP — 웹 탐색 + 로컬 저장 ===\n");

  let messageCount = 0;
  const toolUsages: string[] = [];

  for await (const message of query({
    prompt: `다음 작업을 순서대로 수행해줘:

1. https://news.ycombinator.com에 접속해서 상위 3개 기사의 제목과 링크를 수집
2. 그 중 첫 번째 기사의 댓글 페이지(comments 링크)로 이동
3. 댓글 페이지에서 상위 2-3개 댓글의 분위기를 파악
4. 수집한 모든 정보를 ./hn-report.md 파일로 저장

파일 형식:
# HN Top Stories Report
## 상위 3개 기사
- 제목, 링크, 포인트
## 첫 번째 기사 댓글 분석
- 주요 의견 요약`,
    options: {
      model: "haiku",
      // tools 생략 — 빌트인 + MCP 모두 사용 가능
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      mcpServers: {
        playwright: {
          command: "npx",
          args: ["@playwright/mcp@latest"],
        },
      },
    },
  })) {
    messageCount++;
    const msg = message as any;

    switch (msg.type) {
      case "system":
        if (msg.subtype === "init") {
          const tools = msg.tools ?? [];
          const builtin = tools.filter((t: string) => !t.startsWith("mcp__"));
          const mcp = tools.filter((t: string) => t.startsWith("mcp__"));
          console.log(`🔧 빌트인: ${builtin.length}개 | MCP: ${mcp.length}개\n`);
        }
        break;

      case "assistant":
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");

        if (toolUses?.length > 0) {
          for (const tu of toolUses) {
            const isMcp = tu.name?.startsWith("mcp__");
            const icon = isMcp ? "🌐" : "🔧";
            const shortInput = JSON.stringify(tu.input).slice(0, 120);
            console.log(`${icon} [${messageCount}] ${tu.name}(${shortInput})`);
            toolUsages.push(`${icon} ${tu.name}`);
          }
        }
        if (text) console.log(`🤖 [${messageCount}] ${text.slice(0, 200)}`);
        break;

      case "result":
        console.log(`\n✅ 최종 결과`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        console.log(`\n📊 도구 사용 흐름:`);
        toolUsages.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));
        break;
    }
  }
}

main().catch(console.error);
