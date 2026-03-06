import type { EvalResult } from "../types.js";

/** 리뷰 결과 평가 — CRITICAL/HIGH 이슈 기반 */
export function evaluateReview(reviewOutput: string): EvalResult {
  const criticalCount = (reviewOutput.match(/CRITICAL/gi) || []).length;
  const highCount = (reviewOutput.match(/HIGH/gi) || []).length;
  const mediumCount = (reviewOutput.match(/MEDIUM/gi) || []).length;

  const checks = {
    noCritical: criticalCount === 0,
    noHigh: highCount === 0,
    fewMedium: mediumCount <= 3,
  };

  console.log(
    `  리뷰 평가: CRITICAL=${criticalCount} HIGH=${highCount} MEDIUM=${mediumCount}`
  );

  const issues: string[] = [];
  if (!checks.noCritical) issues.push(`CRITICAL ${criticalCount}개`);
  if (!checks.noHigh) issues.push(`HIGH ${highCount}개`);

  if (issues.length === 0) {
    return { pass: true, feedback: "", details: checks };
  }

  return {
    pass: false,
    feedback: `리뷰 미통과: ${issues.join(", ")}. 해당 이슈를 수정하세요.`,
    details: checks,
  };
}
