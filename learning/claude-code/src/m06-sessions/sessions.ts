/**
 * M06: Sessions — 기억과 맥락 유지
 *
 * session_id를 캡처하고 resume으로 대화를 이어간다
 *
 * 실행: unset CLAUDECODE && npx tsx src/m06-sessions/sessions.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  let sessionId: string | undefined;

  // === 1차 쿼리: 파일 읽기 + 세션 ID 캡처 ===
  console.log("=== 1차 쿼리: 파일 읽기 ===\n");

  for await (const message of query({
    prompt: "package.json을 읽고 의존성 목록을 알려줘.",
    options: {
      tools: ["Read"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    const msg = message as any;
    if (msg.type === "system" && msg.subtype === "init") {
      sessionId = msg.session_id;
      console.log(`📌 세션 ID 캡처: ${sessionId}\n`);
    }
    if (msg.type === "result") {
      console.log(`[1차 결과] ${msg.result?.slice(0, 200)}`);
    }
  }

  // === 2차 쿼리: 세션 이어서 질문 ===
  console.log("\n=== 2차 쿼리: 이전 맥락 기반 질문 ===\n");

  for await (const message of query({
    prompt: "방금 읽은 의존성 중 @anthropic-ai/claude-agent-sdk의 버전은?",
    options: {
      resume: sessionId,
    },
  })) {
    const msg = message as any;
    if (msg.type === "result") {
      console.log(`[2차 결과] ${msg.result?.slice(0, 200)}`);
    }
  }
}

main().catch(console.error);
