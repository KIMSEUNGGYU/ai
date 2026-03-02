/**
 * Step 4: Hooks — 에이전트 감시자
 *
 * PostToolUse 훅으로 모든 도구 사용을 audit.log에 기록한다.
 * PreToolUse 훅으로 위험한 도구를 차단하는 패턴도 실험한다.
 *
 * 실행: unset CLAUDECODE && npx tsx step4-hooks.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile, writeFile } from "fs/promises";

// === 훅 함수 정의 ===

async function auditLogger(input: any, toolUseID: string | undefined) {
  const timestamp = new Date().toISOString();
  const toolName = input.tool_name ?? "unknown";
  const toolInput = JSON.stringify(input.tool_input ?? {}).slice(0, 120);
  const logLine = `${timestamp} | ${toolName} | ${toolInput}\n`;

  await appendFile("./audit.log", logLine);
  console.log(`  📋 [감사 로그] ${toolName} (id: ${toolUseID?.slice(0, 8)}...)`);
  return {};
}

async function main() {
  console.log("=== Step 4: Hooks — 감사 로그 ===\n");

  // audit.log 초기화
  await writeFile("./audit.log", `=== 감사 로그 시작: ${new Date().toISOString()} ===\n`);

  let messageCount = 0;

  for await (const message of query({
    prompt: "이 프로젝트의 파일 목록을 확인하고, package.json의 내용을 읽어줘.",
    options: {
      model: "haiku",
      tools: ["Read", "Glob"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      hooks: {
        PostToolUse: [
          { matcher: ".*", hooks: [auditLogger] }
        ],
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
  console.log(`\n📋 audit.log 내용:`);

  const { readFile } = await import("fs/promises");
  const log = await readFile("./audit.log", "utf-8");
  console.log(log);
}

main().catch(console.error);
