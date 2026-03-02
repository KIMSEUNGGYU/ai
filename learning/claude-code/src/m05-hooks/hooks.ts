/**
 * M05: Hooks — 감사 로그 + 도구 차단
 *
 * PostToolUse로 감사 로그, PreToolUse로 .env 읽기 차단
 *
 * 실행: unset CLAUDECODE && npx tsx src/m05-hooks/hooks.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

async function auditLogger(input: any, toolUseID: string | undefined) {
  const timestamp = new Date().toISOString();
  const toolName = input.tool_name ?? "unknown";
  const toolInput = JSON.stringify(input.tool_input ?? {}).slice(0, 100);
  const logLine = `${timestamp} | ${toolName} | ${toolInput}\n`;

  await appendFile("./audit.log", logLine);
  console.log(`  📋 [감사 로그] ${toolName}`);
  return {};
}

async function envBlocker(input: any) {
  if (input.tool_name === "Read") {
    const filePath = input.tool_input?.file_path ?? "";
    if (filePath.includes(".env")) {
      console.log(`  ❌ [차단] .env 파일 읽기 금지!`);
      return { blocked: true, reason: ".env 파일은 보안상 읽을 수 없습니다" };
    }
  }
  return {};
}

async function main() {
  console.log("=== M05: Hooks — 감사 로그 + 차단 ===\n");

  for await (const message of query({
    prompt: "이 프로젝트의 .env 파일과 package.json을 읽어줘.",
    options: {
      tools: ["Read", "Glob"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      hooks: {
        PreToolUse: [
          { matcher: ".*", hooks: [envBlocker] }
        ],
        PostToolUse: [
          { matcher: ".*", hooks: [auditLogger] }
        ],
      },
    },
  })) {
    const msg = message as any;
    if (msg.type === "result") {
      console.log(`\n✅ 최종 결과: ${msg.result?.slice(0, 200)}`);
    }
  }

  console.log("\n📋 audit.log 파일을 확인하세요!");
}

main().catch(console.error);
