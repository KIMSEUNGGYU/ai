import { writeFile, mkdir } from "node:fs/promises";
import type { EvalReport } from "./types.js";

/** 콘솔에 테이블 형식으로 출력 */
export function printReport<TInput = string, TExpected = unknown>(report: EvalReport<TInput, TExpected>): void {
  const { summary, results } = report;

  console.log("\n" + "═".repeat(70));
  console.log(`  ${report.dataset}  |  ${report.timestamp}`);
  console.log("═".repeat(70));

  // 헤더
  console.log(
    padEnd("Case", 25) +
      padEnd("Score", 8) +
      padEnd("Pass", 7) +
      padEnd("Cost", 10) +
      padEnd("Time", 8)
  );
  console.log("─".repeat(70));

  // 각 케이스
  for (const r of results) {
    const scores = Object.values(r.scores);
    const avgScore =
      scores.reduce((sum, s) => sum + s.score, 0) /
      Math.max(scores.length, 1);
    const allPassed = scores.every((s) => s.pass);

    console.log(
      padEnd(truncate(r.case.name, 23), 25) +
        padEnd(avgScore.toFixed(2), 8) +
        padEnd(allPassed ? "PASS" : "FAIL", 7) +
        padEnd(r.costUsd ? `$${r.costUsd.toFixed(4)}` : "-", 10) +
        padEnd(`${(r.durationMs / 1000).toFixed(1)}s`, 8)
    );

    // 실패한 scorer 상세
    if (!allPassed) {
      for (const [name, score] of Object.entries(r.scores)) {
        if (!score.pass) {
          console.log(`    └ ${name}: ${score.reason ?? "failed"}`);
        }
      }
    }
  }

  // 요약
  console.log("─".repeat(70));
  console.log(
    padEnd("Summary", 25) +
      padEnd(summary.avgScore.toFixed(2), 8) +
      padEnd(`${summary.passed}/${summary.total}`, 7) +
      padEnd(`$${summary.totalCostUsd.toFixed(4)}`, 10) +
      padEnd(`${(summary.totalDurationMs / 1000).toFixed(1)}s`, 8)
  );
  console.log("═".repeat(70) + "\n");
}

/** JSON 파일로 저장 */
export async function saveReport<TInput = string, TExpected = unknown>(
  report: EvalReport<TInput, TExpected>,
  dir: string
): Promise<string> {
  await mkdir(dir, { recursive: true });
  const ts = report.timestamp.replace(/[:.]/g, "").slice(0, 15);
  const filename = `${ts}-${report.dataset}.json`;
  const filepath = `${dir}/${filename}`;
  await writeFile(filepath, JSON.stringify(report, null, 2));
  console.log(`[eval] 결과 저장: ${filepath}`);
  return filepath;
}

function padEnd(str: string, len: number): string {
  return str.padEnd(len);
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 2) + ".." : str;
}
