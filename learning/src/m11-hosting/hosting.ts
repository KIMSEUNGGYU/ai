/**
 * M11: Hosting — 프로덕션 배포
 *
 * 비용 추적 + 재시도 패턴 구현
 *
 * 실행: unset CLAUDECODE && npx tsx src/m11-hosting/hosting.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

interface CostReport {
  totalCost: number;
  totalTurns: number;
  totalDuration: number;
  queryCount: number;
}

async function queryWithRetry(
  prompt: string,
  options: any,
  maxRetries = 3,
): Promise<{ result: string; cost: number; turns: number; duration: number }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let result = "";
      let cost = 0;
      let turns = 0;
      let duration = 0;

      for await (const message of query({ prompt, options })) {
        const msg = message as any;
        if (msg.type === "result") {
          if (msg.subtype === "error") throw new Error(msg.result);
          result = msg.result;
          cost = msg.total_cost_usd;
          turns = msg.num_turns;
          duration = msg.duration_ms;
        }
      }
      return { result, cost, turns, duration };
    } catch (error) {
      console.log(`  ⚠️ 시도 ${attempt}/${maxRetries} 실패: ${error}`);
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Unreachable");
}

async function main() {
  console.log("=== M11: Hosting — 비용 추적 + 재시도 ===\n");

  const report: CostReport = { totalCost: 0, totalTurns: 0, totalDuration: 0, queryCount: 0 };

  const queries = [
    "이 프로젝트의 이름을 알려줘.",
    "package.json의 의존성 수를 알려줘.",
  ];

  for (const prompt of queries) {
    console.log(`📝 쿼리: "${prompt}"`);
    try {
      const { result, cost, turns, duration } = await queryWithRetry(prompt, {
        tools: ["Read"],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      });

      report.totalCost += cost;
      report.totalTurns += turns;
      report.totalDuration += duration;
      report.queryCount++;

      console.log(`  ✅ ${result.slice(0, 100)}`);
      console.log(`  💰 $${cost.toFixed(4)} | ${turns}턴 | ${duration}ms\n`);
    } catch (error) {
      console.log(`  ❌ 최종 실패: ${error}\n`);
    }
  }

  console.log("═".repeat(40));
  console.log("📊 비용 보고서");
  console.log(`   총 비용: $${report.totalCost.toFixed(4)}`);
  console.log(`   총 쿼리: ${report.queryCount}회`);
  console.log(`   평균 비용: $${(report.totalCost / report.queryCount || 0).toFixed(4)}/쿼리`);
  console.log(`   총 시간: ${(report.totalDuration / 1000).toFixed(1)}초`);
}

main().catch(console.error);
