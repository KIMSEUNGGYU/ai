import { matchesAll, minLength } from "@agents/eval";
import type { Scorer } from "@agents/eval";

interface SpecExpected {
  requiredSections: RegExp[];
  qualityPatterns: RegExp[];
  minLength: number;
}

/** 필수 섹션 존재 여부 */
export const hasRequiredSections: Scorer<SpecExpected> = (output, expected) => {
  return matchesAll(expected.requiredSections)(output, expected);
};

/** 구조적 품질 패턴 */
export const hasQualityPatterns: Scorer<SpecExpected> = (output, expected) => {
  return matchesAll(expected.qualityPatterns)(output, expected);
};

/** 최소 길이 충족 */
export const meetsMinLength: Scorer<SpecExpected> = (output, expected) => {
  return minLength(expected.minLength)(output, expected);
};

/** 종합 spec scorer 모음 */
export const specScorers: Record<string, Scorer<SpecExpected>> = {
  requiredSections: hasRequiredSections,
  qualityPatterns: hasQualityPatterns,
  minLength: meetsMinLength,
};
