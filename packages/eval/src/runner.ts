import type {
  CaseResult,
  EvalReport,
  RunEvalOptions,
  ScoreResult,
} from "./types.js";

export async function runEval<TInput, TExpected>(
  options: RunEvalOptions<TInput, TExpected>
): Promise<EvalReport<TInput, TExpected>> {
  const { dataset, agent, scorers, timeout = 60_000, maxCost, tags } = options;

  // 태그 필터링
  const cases = tags
    ? dataset.cases.filter((c) =>
        c.tags?.some((t) => tags.includes(t))
      )
    : dataset.cases;

  console.log(
    `\n[eval] "${dataset.name}" 시작 — ${cases.length}개 케이스${tags ? ` (tags: ${tags.join(", ")})` : ""}\n`
  );

  const results: CaseResult<TInput, TExpected>[] = [];
  let totalCost = 0;

  for (const evalCase of cases) {
    // 비용 상한 체크
    if (maxCost && totalCost >= maxCost) {
      console.log(`[eval] 비용 상한 도달 ($${maxCost}). 중단.`);
      break;
    }

    console.log(`  [${evalCase.id}] ${evalCase.name}...`);
    const start = Date.now();

    let output: unknown;
    let costUsd: number | undefined;
    let error: string | undefined;

    try {
      const result = await Promise.race([
        agent(evalCase.input),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeout)
        ),
      ]);
      output = result.output;
      costUsd = result.costUsd;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      output = "";
    }

    const durationMs = Date.now() - start;

    // 채점
    const scores: Record<string, ScoreResult> = {};
    if (!error) {
      for (const [name, scorer] of Object.entries(scorers)) {
        try {
          scores[name] = scorer(output, evalCase.expected);
        } catch (err) {
          scores[name] = {
            score: 0,
            pass: false,
            reason: `Scorer error: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      }
    } else {
      // 에러 시 모든 scorer 0점
      for (const name of Object.keys(scorers)) {
        scores[name] = { score: 0, pass: false, reason: error };
      }
    }

    if (costUsd) totalCost += costUsd;

    const caseResult: CaseResult<TInput, TExpected> = {
      case: evalCase,
      output,
      scores,
      durationMs,
      costUsd,
      error,
    };
    results.push(caseResult);

    // 케이스 결과 즉시 출력
    const allPassed = Object.values(scores).every((s) => s.pass);
    const avgScore =
      Object.values(scores).reduce((sum, s) => sum + s.score, 0) /
      Math.max(Object.values(scores).length, 1);
    console.log(
      `    ${allPassed ? "PASS" : "FAIL"} | score: ${avgScore.toFixed(2)} | ${(durationMs / 1000).toFixed(1)}s${costUsd ? ` | $${costUsd.toFixed(4)}` : ""}${error ? ` | ERROR: ${error}` : ""}`
    );
  }

  // 요약 계산
  const summary = computeSummary(results);

  return {
    dataset: dataset.name,
    timestamp: new Date().toISOString(),
    results,
    summary,
  };
}

function computeSummary<TInput, TExpected>(
  results: CaseResult<TInput, TExpected>[]
): EvalReport<TInput, TExpected>["summary"] {
  let passed = 0;
  let totalScore = 0;
  let totalCost = 0;
  let totalDuration = 0;

  for (const r of results) {
    const scores = Object.values(r.scores);
    const allPassed = scores.every((s) => s.pass);
    if (allPassed) passed++;
    totalScore +=
      scores.reduce((sum, s) => sum + s.score, 0) /
      Math.max(scores.length, 1);
    totalCost += r.costUsd ?? 0;
    totalDuration += r.durationMs;
  }

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    avgScore: results.length > 0 ? totalScore / results.length : 0,
    totalCostUsd: totalCost,
    totalDurationMs: totalDuration,
  };
}
