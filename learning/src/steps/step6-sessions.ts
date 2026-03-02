/**
 * Step 6: Sessions — 대화 이어가기
 *
 * 1차 쿼리에서 세션 ID를 캡처하고,
 * 2차 쿼리에서 resume 옵션으로 이전 맥락을 기억한 채 대화를 이어간다.
 *
 * 관찰 포인트:
 * - system/init에서 session_id가 어떤 형태로 오는가?
 * - resume한 2차 쿼리가 1차 맥락을 실제로 기억하는가?
 * - resume 없이 같은 질문을 하면 어떻게 되는가? (3차 실험)
 *
 * 실행: unset CLAUDECODE && npx tsx step6-sessions.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

/** 메시지 스트림을 관찰하는 공통 함수 */
async function observeQuery(
  label: string,
  options: Parameters<typeof query>[0],
): Promise<{ sessionId?: string; result?: string }> {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`${label}`);
  console.log(`${"=".repeat(50)}\n`);

  let messageCount = 0;
  let sessionId: string | undefined;
  let resultText: string | undefined;

  for await (const message of query(options)) {
    messageCount++;
    const msg = message as any;

    switch (msg.type) {
      case "system":
        sessionId = msg.session_id;
        console.log(`📦 [${messageCount}] system/${msg.subtype}`);
        console.log(`   session_id: ${sessionId}`);
        console.log(`   tools: ${msg.tools?.length ?? 0}개`);
        break;

      case "assistant": {
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");

        const parts: string[] = [];
        if (text) parts.push(`text: "${text.slice(0, 120)}${text.length > 120 ? "..." : ""}"`);
        if (toolUses?.length > 0) parts.push(`tools: [${toolUses.map((t: any) => t.name).join(", ")}]`);
        console.log(`🤖 [${messageCount}] assistant | ${parts.join(" | ") || "(empty)"}`);
        break;
      }

      case "user": {
        const content = JSON.stringify(msg.message?.content ?? msg).slice(0, 150);
        console.log(`👤 [${messageCount}] user | ${content}`);
        break;
      }

      case "result":
        resultText = msg.result;
        console.log(`\n✅ [${messageCount}] result/${msg.subtype}`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        console.log(`   session_id: ${msg.session_id ?? "(없음)"}`);
        console.log(`   result: ${msg.result?.slice(0, 300)}`);
        break;

      default:
        console.log(`⬜ [${messageCount}] ${msg.type}/${msg.subtype ?? ""}`);
    }
  }

  console.log(`\n--- ${label} 완료 (${messageCount}개 메시지) ---`);
  return { sessionId, result: resultText };
}

async function main() {
  console.log("=== Step 6: Sessions — 대화 이어가기 ===");

  // === 1차 쿼리: 파일 읽기 + 세션 ID 캡처 ===
  const first = await observeQuery("1차 쿼리: 파일 읽고 세션 ID 캡처", {
    prompt: "이 프로젝트의 package.json을 읽고, 의존성 목록을 간단히 알려줘.",
    options: {
      model: "haiku",
      tools: ["Read"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  });

  if (!first.sessionId) {
    console.error("❌ 세션 ID를 캡처하지 못했습니다!");
    return;
  }

  console.log(`\n🔑 캡처한 세션 ID: ${first.sessionId}`);

  // === 2차 쿼리: resume으로 이전 맥락 이어가기 ===
  const second = await observeQuery("2차 쿼리: resume으로 이전 맥락 기반 질문", {
    prompt: "방금 읽은 의존성 중에서 @anthropic-ai/claude-agent-sdk의 버전은 뭐야?",
    options: {
      resume: first.sessionId,
    },
  });

  // === 3차 쿼리: resume 없이 같은 질문 (대조 실험) ===
  const third = await observeQuery("3차 쿼리: resume 없이 같은 질문 (대조군)", {
    prompt: "방금 읽은 의존성 중에서 @anthropic-ai/claude-agent-sdk의 버전은 뭐야?",
    options: {
      model: "haiku",
      tools: ["Read"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  });

  // === 결과 비교 ===
  console.log("\n" + "=".repeat(50));
  console.log("📊 결과 비교");
  console.log("=".repeat(50));
  console.log(`\n1차 세션 ID: ${first.sessionId}`);
  console.log(`2차 세션 ID: ${second.sessionId} (${first.sessionId === second.sessionId ? "✅ 동일" : "❌ 다름"})`);
  console.log(`3차 세션 ID: ${third.sessionId} (${first.sessionId === third.sessionId ? "동일" : "📌 새 세션"})`);
  console.log(`\n2차 (resume O): ${second.result?.slice(0, 200)}`);
  console.log(`3차 (resume X): ${third.result?.slice(0, 200)}`);
}

main().catch(console.error);
