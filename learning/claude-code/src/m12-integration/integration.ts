/**
 * M12: 통합 프로젝트 — 나만의 하네스
 *
 * M01~M11의 모든 개념을 조합한 "평가 루프 코드 리뷰 시스템"
 *
 * 실행: unset CLAUDECODE && npx tsx src/m12-integration/integration.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

function evaluateReview(result: string): { pass: boolean; feedback: string } {
  const checks = {
    "코드 예시": result.includes("```"),
    "심각도 등급": /심각|중요|낮음|높음|critical|high|medium|low/i.test(result),
    "개선 제안": /제안|개선|suggest|improve|recommend/i.test(result),
  };

  const missing = Object.entries(checks)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  if (missing.length === 0) {
    return { pass: true, feedback: "" };
  }
  return { pass: false, feedback: missing.join(", ") };
}

async function auditLogger(input: any) {
  const log = `${new Date().toISOString()} | ${input.tool_name} | ${JSON.stringify(input.tool_input ?? {}).slice(0, 80)}\n`;
  await appendFile("./review-audit.log", log);
  return {};
}

async function main() {
  const targetFile = "src/m01-hello/hello.ts";
  let sessionId: string | undefined;
  let result = "";
  const maxAttempts = 3;
  let totalCost = 0;

  console.log("=== M12: 통합 프로젝트 — 평가 루프 코드 리뷰 ===\n");
  console.log(`📎 대상: ${targetFile}\n`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`── 리뷰 시도 ${attempt}/${maxAttempts} ──`);

    const prompt = attempt === 1
      ? `${targetFile} 파일을 리뷰해줘. 반드시 다음을 포함해: (1) 코드 예시(\`\`\`), (2) 각 이슈에 [심각/중요/낮음] 등급, (3) 개선 제안.`
      : `이전 리뷰에 다음이 누락되었습니다: ${evaluateReview(result).feedback}. 해당 항목을 추가해서 리뷰를 보완해줘.`;

    for await (const message of query({
      prompt,
      options: {
        ...(sessionId ? { resume: sessionId } : {}),
        systemPrompt: `시니어 TypeScript 코드 리뷰어.
각 이슈에 [심각|중요|낮음] 등급을 표시하고,
구체적인 코드 예시(\`\`\` 블록)와 개선 제안을 포함하세요.
결과를 마크다운으로 출력하세요.`,
        tools: ["Read", "Glob", "Grep"],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        hooks: {
          PostToolUse: [
            { matcher: ".*", hooks: [auditLogger] }
          ],
        },
      },
    })) {
      const msg = message as any;
      if (msg.type === "system" && msg.subtype === "init") {
        sessionId = msg.session_id;
      }
      if (msg.type === "assistant") {
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        if (text) result = text;
      }
      if (msg.type === "result") {
        totalCost += msg.total_cost_usd ?? 0;
        console.log(`  💰 $${(msg.total_cost_usd ?? 0).toFixed(4)} | ${msg.num_turns}턴`);
      }
    }

    const evaluation = evaluateReview(result);
    if (evaluation.pass) {
      console.log(`  ✅ 평가 통과! (${attempt}번째 시도)\n`);
      break;
    } else {
      console.log(`  ❌ 평가 실패: ${evaluation.feedback}`);
      if (attempt === maxAttempts) {
        console.log(`  ⚠️ 최대 시도 초과. 마지막 결과 사용.\n`);
      }
    }
  }

  console.log("═".repeat(50));
  console.log("📊 최종 리뷰:");
  console.log(result.slice(0, 800));
  console.log(`\n💰 총 비용: $${totalCost.toFixed(4)}`);
  console.log("📋 감사 로그: review-audit.log");
}

main().catch(console.error);
