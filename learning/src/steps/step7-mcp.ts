import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 7: MCP — 웹 자동화 ===\n");

  let messageCount = 0;

  for await (const message of query({
    prompt: "https://example.com을 열고, 페이지의 제목과 본문 내용을 설명해줘.",
    options: {
      model: "haiku",
      tools: [],  // 빌트인 도구 비활성화 — MCP 도구만으로 작업
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
          console.log(`🔧 [system/init] 세션: ${msg.session_id}`);
          // MCP 도구 목록 관찰
          const tools = msg.tools ?? [];
          const mcpTools = tools.filter((t: string) => t.startsWith("mcp__"));
          const builtinTools = tools.filter((t: string) => !t.startsWith("mcp__"));
          console.log(`   빌트인 도구: ${builtinTools.length}개 ${builtinTools.length > 0 ? builtinTools.join(", ") : "(없음)"}`);
          console.log(`   MCP 도구: ${mcpTools.length}개`);
          // Playwright MCP 도구만 필터
          const pwTools = mcpTools.filter((t: string) => t.includes("playwright"));
          if (pwTools.length > 0) {
            console.log(`   🎭 Playwright 도구: ${pwTools.join(", ")}`);
          }
          // 기존 MCP 도구 (Linear 등)
          const otherMcp = mcpTools.filter((t: string) => !t.includes("playwright"));
          if (otherMcp.length > 0) {
            console.log(`   📦 기타 MCP 도구: ${otherMcp.length}개`);
          }
        }
        break;

      case "assistant":
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");

        if (toolUses?.length > 0) {
          for (const tu of toolUses) {
            const isMcp = tu.name?.startsWith("mcp__");
            const icon = isMcp ? "🌐" : "🔧";
            console.log(`${icon} [${messageCount}] ${tu.name}(${JSON.stringify(tu.input).slice(0, 120)})`);
          }
        }
        if (text) console.log(`🤖 [${messageCount}] ${text.slice(0, 300)}`);
        break;

      case "result":
        console.log(`\n✅ [${messageCount}] 최종 결과`);
        console.log(`   result: "${msg.result?.slice(0, 400)}"`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        break;
    }
  }
}

main().catch(console.error);
