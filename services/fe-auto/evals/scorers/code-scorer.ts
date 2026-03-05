import { matchesAll, contains, custom } from "@agents/eval";
import type { Scorer, ScoreResult } from "@agents/eval";

interface CodeExpected {
  filePatterns: RegExp[];
  noErrors: boolean;
  minFiles: number;
}

/** 에이전트 출력에서 파일 생성 관련 패턴 매칭 */
export const hasFilePatterns: Scorer<CodeExpected> = (output, expected) => {
  return matchesAll(expected.filePatterns)(output, expected);
};

/** 빌드/타입 에러 없음 */
export const noErrors: Scorer<CodeExpected> = (output) => {
  const text = String(output);
  const hasError = /error TS\d+|build failed|compilation error|type.*error|cannot find.*module/i.test(text);
  return {
    score: hasError ? 0 : 1,
    pass: !hasError,
    reason: hasError ? "빌드/타입 에러 발견" : undefined,
  };
};

/** FE 컨벤션 위반 없음 */
export const noConventionViolation: Scorer<CodeExpected> = (output) => {
  const text = String(output);
  const hasViolation = /CRITICAL|심각한 위반/i.test(text);
  return {
    score: hasViolation ? 0 : 1,
    pass: !hasViolation,
    reason: hasViolation ? "FE 컨벤션 심각한 위반" : undefined,
  };
};

/** 종합 code scorer 모음 */
export const codeScorers: Record<string, Scorer<CodeExpected>> = {
  filePatterns: hasFilePatterns,
  noErrors,
  noConventionViolation,
};
