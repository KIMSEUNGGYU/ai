/**
 * M08: MCP — 외부 시스템 연동
 *
 * MCP filesystem 서버를 연결하고 도구 확장을 관찰
 *
 * 실행: unset CLAUDECODE && npx tsx src/m08-mcp/mcp.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M08: MCP — 외부 시스템 연동 ===\n");

  for await (const message of query({
    prompt: "현재 디렉토리의 파일 구조를 확인하고 설명해줘.",
    options: {
      tools: ["Read", "Glob"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      mcpServers: {
        filesystem: {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            process.cwd(),
          ],
        },
      },
    },
  })) {
    const msg = message as any;

    if (msg.type === "system" && msg.subtype === "init") {
      console.log(`📦 tools: ${msg.tools?.length}개`);
      const mcpTools = msg.tools?.filter((t: string) => t.includes("mcp")) ?? [];
      console.log(`   빌트인: ${(msg.tools?.length ?? 0) - mcpTools.length}개`);
      console.log(`   MCP: ${mcpTools.length}개 (${mcpTools.slice(0, 3).join(", ")}...)`);
    }

    if (msg.type === "assistant") {
      const text = msg.message?.content
        ?.filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      if (text) console.log(`🤖 ${text.slice(0, 300)}`);
    }

    if (msg.type === "result") {
      console.log(`\n✅ turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
    }
  }
}

main().catch(console.error);
