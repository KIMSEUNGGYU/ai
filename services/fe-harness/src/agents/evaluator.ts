import { readFileSync } from 'node:fs';
import { callClaude } from '../lib/claude.js';
import type { HarnessConfig } from '../types.js';

export async function runEvaluator(
  contract: string,
  generatedCode: string,
  referenceCode: string,
  config: HarnessConfig,
  cwd: string,
): Promise<string> {
  const conventionContents = config.conventions
    .map(path => {
      try { return `--- ${path} ---\n${readFileSync(path, 'utf-8')}\n--- end ---`; }
      catch { return ''; }
    })
    .filter(Boolean)
    .join('\n\n');

  const { scoring } = config;

  const systemPrompt = `너는 FE 하네스의 Evaluator다.
Generator의 사고 과정을 모른다. 코드와 contract만 보고 판단한다.

## 컨벤션
${conventionContents}

## 점수 산출
품질 점수 = (Contract 통과율 × ${scoring.contractWeight}) + (열린 평가 × ${scoring.openEvalWeight}) + (Contrarian × ${scoring.contrarianWeight})

## 통과 판정
Sprint 통과 = Contract 전부 pass AND 품질 점수 ≥ ${scoring.qualityThreshold}`;

  const prompt = `## Contract (평가 기준)
${contract}

## 생성된 파일 목록
${generatedCode}

위 파일들을 Read 도구로 직접 읽고 평가해.

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

### D. Contract 검토
코드가 아니라 contract가 부실한 건 아닌지 점검:
- 누락된 평가 기준이 있는가?
- 기준이 모호하거나 검증 불가능한가?
- 기존 코드 패턴에서 중요한 항목이 빠졌는가?
문제가 없으면 "없음"으로 표기.

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

## D. Contract 검토
{누락된 기준이나 모호한 항목. 없으면 "없음"}

## 방향성

FAIL이면 추가로 feedback도 출력:

# Sprint {N} Feedback — Round {R}
## 수정 필요
## 검토 권장
## Contract 수정 제안
{contract에 추가/수정할 기준. 없으면 생략}`;

  return callClaude(prompt, { model: 'opus', systemPrompt, cwd });
}
