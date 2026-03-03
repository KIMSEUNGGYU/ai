import type { EvalResult, ReviewResult } from "../types.js";

/** ReviewResult를 EvalResult로 변환 — 파이프라인 루프용 */
export function evaluateReview(review: ReviewResult): EvalResult {
  const criticalCount = review.issues.filter(
    (i) => i.severity === "CRITICAL"
  ).length;
  const highCount = review.issues.filter(
    (i) => i.severity === "HIGH"
  ).length;
  const mediumCount = review.issues.filter(
    (i) => i.severity === "MEDIUM"
  ).length;

  console.log(
    `  리뷰 평가: CRITICAL=${criticalCount} HIGH=${highCount} MEDIUM=${mediumCount}`
  );

  const checks = {
    noCritical: criticalCount === 0,
    noHigh: highCount === 0,
    fewMedium: mediumCount <= 3,
  };

  if (checks.noCritical && checks.noHigh) {
    return { pass: true, feedback: "", details: checks };
  }

  // CRITICAL/HIGH 이슈만 수정 대상으로 전달
  const actionableIssues = review.issues
    .filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH")
    .map((i) => {
      let line = `- [${i.severity}] ${i.file}${i.line ? `:${i.line}` : ""} — ${i.message}`;
      if (i.suggestion) line += `\n  제안: ${i.suggestion}`;
      return line;
    })
    .join("\n");

  return {
    pass: false,
    feedback: `Codex 리뷰에서 ${criticalCount + highCount}개 이슈 발견:\n\n${actionableIssues}`,
    details: checks,
  };
}
