import { Codex } from "@openai/codex-sdk";
import type { ReviewResult, ReviewIssue } from "../types.js";

export async function runReviewAgent(
  targetProject: string,
  designSpec: string,
  implOutput: string
): Promise<{ result: ReviewResult; cost: number }> {
  console.log("\n[Review Agent] Codex 코드 리뷰 시작\n");

  const apiKey = process.env.CODEX_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CODEX_API_KEY 환경변수가 설정되지 않았습니다.\n" +
        "export CODEX_API_KEY=<your-openai-api-key>"
    );
  }

  const codex = new Codex({ apiKey });
  const thread = codex.startThread({
    workingDirectory: targetProject,
    sandboxMode: "read-only",
  });

  const reviewPrompt = buildReviewPrompt(targetProject, designSpec, implOutput);

  console.log("  Codex에 리뷰 요청 중...");
  const turn = await thread.run(reviewPrompt);
  const reviewText = turn.finalResponse;
  console.log("  Codex 리뷰 완료\n");

  // 비용: 토큰 수만 로깅 (모델별 가격이 달라 정확한 추정 불가)
  const usage = turn.usage;
  if (usage) {
    console.log(
      `  토큰: input=${usage.input_tokens} output=${usage.output_tokens}`
    );
  }

  const result = parseReviewResult(reviewText);

  console.log(
    `  이슈: CRITICAL=${result.issues.filter((i) => i.severity === "CRITICAL").length}` +
      ` HIGH=${result.issues.filter((i) => i.severity === "HIGH").length}` +
      ` MEDIUM=${result.issues.filter((i) => i.severity === "MEDIUM").length}` +
      ` LOW=${result.issues.filter((i) => i.severity === "LOW").length}`
  );

  return { result, cost: 0 };
}

function buildReviewPrompt(
  targetProject: string,
  designSpec: string,
  implOutput: string
): string {
  return `${targetProject} 프로젝트에 생성된 FE 코드를 리뷰하세요.

## 설계 산출물
${designSpec}

## 구현 결과
${implOutput}

## 리뷰 기준
1. 코드 품질 (가독성, 유지보수성)
2. 버그/로직 오류
3. 보안 이슈
4. FE 컨벤션 준수 여부
5. 타입 안전성
6. 설계 산출물과의 일치도

## 출력 형식 (반드시 이 형식으로)
각 이슈를 아래 형식으로:
- [CRITICAL] {파일}:{라인} — {설명} | 제안: {수정 제안}
- [HIGH] {파일}:{라인} — {설명} | 제안: {수정 제안}
- [MEDIUM] {파일} — {설명}
- [LOW] {파일} — {설명}

이슈가 없으면 "리뷰 통과. 이슈 없음." 출력.

마지막에 한 줄 요약을 작성하세요.`;
}

/** Codex 리뷰 텍스트를 구조화된 ReviewResult로 파싱 */
function parseReviewResult(reviewText: string): ReviewResult {
  const issues: ReviewIssue[] = [];

  // [SEVERITY] file:line — message | 제안: suggestion
  const issuePattern =
    /\[(\w+)\]\s+([^—\n]+?)(?::(\d+))?\s*—\s*([^|\n]+)(?:\|\s*제안:\s*(.+))?/g;
  let match;

  while ((match = issuePattern.exec(reviewText)) !== null) {
    const severity = match[1].toUpperCase();
    if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(severity)) {
      issues.push({
        severity: severity as ReviewIssue["severity"],
        file: match[2].trim(),
        line: match[3] ? parseInt(match[3]) : undefined,
        message: match[4].trim(),
        suggestion: match[5]?.trim(),
      });
    }
  }

  const hasCriticalOrHigh = issues.some(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  );

  // fallback: 정규식 파싱 실패 시 단순 문자열 매칭 (fe-auto 패턴)
  const fallbackCritical =
    issues.length === 0 && /CRITICAL/i.test(reviewText);
  const fallbackHigh = issues.length === 0 && /HIGH/i.test(reviewText);

  // 요약: 마지막 비빈 줄
  const lines = reviewText.trim().split("\n").filter(Boolean);
  const summary = lines[lines.length - 1] || "리뷰 완료";

  return {
    issues,
    summary,
    pass: !hasCriticalOrHigh && !fallbackCritical && !fallbackHigh,
  };
}
