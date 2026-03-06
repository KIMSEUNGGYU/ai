import type { EvalResult } from "../types.js";

/**
 * 코드 평가 — 빌드/타입체크 결과 기반
 * 실제 tsc, build 실행은 에이전트가 수행하고
 * 여기서는 에이전트의 출력에서 결과를 파싱
 */
export function evaluateCode(agentOutput: string): EvalResult {
  const checks = {
    noBuildError: !/error TS\d+|build failed|compilation error/i.test(agentOutput),
    noTypeError: !/type.*error|cannot find.*module|is not assignable/i.test(agentOutput),
    filesCreated: /생성|created|wrote|파일/i.test(agentOutput),
    conventionFollowed: !/CRITICAL|심각한 위반/i.test(agentOutput),
  };

  const issues: string[] = [];
  if (!checks.noBuildError) issues.push("빌드 에러 존재");
  if (!checks.noTypeError) issues.push("타입 에러 존재");
  if (!checks.filesCreated) issues.push("파일 생성 확인 안 됨");
  if (!checks.conventionFollowed) issues.push("FE 컨벤션 심각한 위반");

  console.log(
    `  코드 평가: 빌드=${checks.noBuildError} 타입=${checks.noTypeError} 파일=${checks.filesCreated} 컨벤션=${checks.conventionFollowed}`
  );

  if (issues.length === 0) {
    return { pass: true, feedback: "", details: checks };
  }

  return {
    pass: false,
    feedback: `코드 문제 발견: ${issues.join(", ")}. 에러를 수정하세요.`,
    details: checks,
  };
}
