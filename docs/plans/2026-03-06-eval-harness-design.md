# Eval Harness 설계

> 목적: fe-auto 에이전트 품질 회귀 방지 + eval 개념 학습
> 대상: fe-auto (1차), 추후 morning-brief 확장
> 실행: CLI 먼저, 안정화 후 CI
> 구현: 외부 라이브러리 없이 직접 구축
> API: 실제 LLM 호출 (live eval)

## 구조

```
packages/eval/                    @agents/eval (공유 패키지)
├── src/
│   ├── types.ts                 핵심 인터페이스
│   ├── runner.ts                에이전트 실행 + 결과 수집
│   ├── scorer.ts                Scorer 인터페이스 + 내장 scorer
│   └── reporter.ts             결과 출력 (콘솔 테이블 + JSON)
├── package.json
└── tsconfig.json

services/fe-auto/
├── evals/
│   ├── datasets/
│   │   ├── spec-eval.dataset.ts
│   │   └── code-eval.dataset.ts
│   ├── scorers/
│   │   ├── spec-scorer.ts
│   │   └── code-scorer.ts
│   ├── agents/
│   │   ├── spec-agent-wrapper.ts
│   │   └── code-agent-wrapper.ts
│   ├── results/                 .gitignore 대상
│   └── run.ts                   CLI 진입점
```

## 코어 타입

```typescript
interface EvalCase<TInput = string, TExpected = unknown> {
  id: string;
  name: string;
  input: TInput;
  expected: TExpected;
  tags?: string[];
}

interface EvalDataset<TInput, TExpected> {
  name: string;
  cases: EvalCase<TInput, TExpected>[];
}

interface ScoreResult {
  score: number;       // 0.0 ~ 1.0
  pass: boolean;
  reason?: string;
}

interface EvalResult<TInput, TExpected> {
  case: EvalCase<TInput, TExpected>;
  output: unknown;
  scores: Record<string, ScoreResult>;
  durationMs: number;
  costUsd?: number;
}

interface EvalReport {
  dataset: string;
  timestamp: string;
  results: EvalResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
    totalCostUsd: number;
    totalDurationMs: number;
  };
}
```

## Runner

```typescript
type AgentFn<TInput> = (input: TInput) => Promise<{ output: unknown; costUsd?: number }>;

async function runEval<TInput, TExpected>(options: {
  dataset: EvalDataset<TInput, TExpected>;
  agent: AgentFn<TInput>;
  scorers: Record<string, Scorer<TExpected>>;
  timeout?: number;        // 케이스별 타임아웃 (기본 60s)
  maxCost?: number;        // 전체 비용 상한
}): Promise<EvalReport>
```

## 내장 Scorers

- `exactMatch` — 정확 일치
- `contains` — 문자열 포함 여부
- `jsonMatch` — JSON 구조 부분 매칭
- `llmJudge` — LLM 기반 채점 (추후)

## fe-auto 평가 전략

파이프라인 3단계를 분리 평가:

| 단계 | 입력 | Scorer |
|------|------|--------|
| Spec Agent | 기획문서 | `hasRequiredSections`, `jsonMatch` |
| Code Agent | 스펙 문서 | `filesCreated`, `typeCheck` |
| Review Agent | 코드 출력 | `contains("통과")` |

## CLI

```bash
pnpm eval:fe-auto              # 전체
pnpm eval:fe-auto --tag spec   # 스펙만
pnpm eval:fe-auto --tag code   # 코드만
```

## 리포팅

- 콘솔: 테이블 형식 (Case, Score, Pass, Cost, Duration)
- JSON: `evals/results/{timestamp}-{dataset}.json` (.gitignore)
- 시계열 비교 가능

## 에러 핸들링

- 에이전트 실패 → score 0, reason에 에러 메시지
- 타임아웃 → 케이스별 timeout (기본 60s)
- 비용 상한 → `--max-cost` 옵션
