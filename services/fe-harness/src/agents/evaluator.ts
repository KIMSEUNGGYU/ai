import { readFileSync } from 'node:fs';
import { callClaude } from '../lib/claude.js';
import type { HarnessConfig } from '../types.js';

export function runEvaluator(
  contract: string,
  generatedCode: string,
  referenceCode: string,
  config: HarnessConfig,
  cwd: string,
): string {
  const conventionContents = config.conventions
    .map(path => {
      try { return `--- ${path} ---\n${readFileSync(path, 'utf-8')}\n--- end ---`; }
      catch { return ''; }
    })
    .filter(Boolean)
    .join('\n\n');

  const { scoring } = config;

  const prompt = `너는 FE 하네스의 Evaluator다.
Generator의 사고 과정을 모른다. 코드와 contract만 보고 판단한다.

## 컨벤션
${conventionContents}

## Contract (평가 기준)
${contract}

## 생성된 코드
${generatedCode}

## 참조 코드 (패턴 비교용)
${referenceCode}

## 평가 프로토콜

### A. Contract 기준 (닫힌 평가)
contract의 "코드 품질" 항목을 하나씩 검증. 각 항목에 pass/fail + 구체적 근거.

### B. 열린 평가 (자유 판단)
- 기존 코드 패턴과 일관성
- 불필요한 복잡도
- 컨벤션 세부 규칙 위반
이슈에 심각도: 심각(0.5), 중간(0.7), 경미(0.85)

### C. Contrarian (반대 관점)
- "이 코드의 가장 약한 점은?"
- "6개월 후 문제될 부분은?"
약점에 심각도: 중간(0.6), 경미(0.8)

## 점수 산출
품질 점수 = (Contract 통과율 × ${scoring.contractWeight}) + (열린 평가 × ${scoring.openEvalWeight}) + (Contrarian × ${scoring.contrarianWeight})

## 통과 판정
Sprint 통과 = Contract 전부 pass AND 품질 점수 ≥ ${scoring.qualityThreshold}

## 출력 형식 (반드시 이 형식으로)

# Sprint {N} Eval — Round {R}

## 메타
- 시각: {now}

## 통과 판정: {PASS | FAIL (사유)}

## 품질 점수: {점수}/10
| 영역 | 가중치 | 점수 | 산출 |
|------|--------|------|------|
| A. Contract 기준 | 60% | {통과율} | {산출값} |
| B. 열린 평가 | 30% | {값} | {산출값} |
| C. Contrarian | 10% | {값} | {산출값} |

## A. Contract 기준
| # | 기준 | 결과 | 근거 |
|---|------|------|------|

## B. 열린 평가

## C. Contrarian

## 방향성

FAIL이면 추가로 feedback도 출력:

# Sprint {N} Feedback — Round {R}
## 수정 필요
## 검토 권장`;

  return callClaude(prompt, { model: 'opus', cwd });
}
