import type { ScoreResult, Scorer } from "./types.js";

/** 정확 일치 */
export function exactMatch<T>(): Scorer<T> {
  return (output: unknown, expected: T): ScoreResult => {
    const pass = JSON.stringify(output) === JSON.stringify(expected);
    return { score: pass ? 1.0 : 0.0, pass };
  };
}

/** 문자열 포함 여부 */
export function contains(substring: string): Scorer<unknown> {
  return (output: unknown): ScoreResult => {
    const text = String(output);
    const pass = text.includes(substring);
    return {
      score: pass ? 1.0 : 0.0,
      pass,
      reason: pass ? undefined : `"${substring}" not found in output`,
    };
  };
}

/** 여러 문자열 중 하나라도 포함 */
export function containsAny(substrings: string[]): Scorer<unknown> {
  return (output: unknown): ScoreResult => {
    const text = String(output);
    const found = substrings.filter((s) => text.includes(s));
    const pass = found.length > 0;
    return {
      score: pass ? found.length / substrings.length : 0.0,
      pass,
      reason: pass ? undefined : `None of [${substrings.join(", ")}] found`,
    };
  };
}

/** 정규식 매칭 — 매칭 비율을 점수로 */
export function matchesAll(patterns: RegExp[]): Scorer<unknown> {
  return (output: unknown): ScoreResult => {
    const text = String(output);
    const matched = patterns.filter((p) => p.test(text));
    const score = patterns.length > 0 ? matched.length / patterns.length : 0;
    return {
      score,
      pass: matched.length === patterns.length,
      reason:
        matched.length < patterns.length
          ? `${matched.length}/${patterns.length} patterns matched`
          : undefined,
    };
  };
}

/** 최소 길이 체크 */
export function minLength(min: number): Scorer<unknown> {
  return (output: unknown): ScoreResult => {
    const len = String(output).length;
    const pass = len >= min;
    return {
      score: pass ? 1.0 : len / min,
      pass,
      reason: pass ? undefined : `Length ${len} < minimum ${min}`,
    };
  };
}

/** 커스텀 scorer 생성 헬퍼 */
export function custom<TExpected>(
  fn: (output: unknown, expected: TExpected) => { score: number; reason?: string }
): Scorer<TExpected> {
  return (output: unknown, expected: TExpected): ScoreResult => {
    const result = fn(output, expected);
    return { ...result, pass: result.score >= 0.5 };
  };
}
