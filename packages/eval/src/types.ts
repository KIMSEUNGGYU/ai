/** 개별 eval 케이스 */
export interface EvalCase<TInput = string, TExpected = unknown> {
  id: string;
  name: string;
  input: TInput;
  expected: TExpected;
  tags?: string[];
}

/** eval 케이스 모음 */
export interface EvalDataset<TInput = string, TExpected = unknown> {
  name: string;
  cases: EvalCase<TInput, TExpected>[];
}

/** 개별 scorer 결과 */
export interface ScoreResult {
  score: number; // 0.0 ~ 1.0
  pass: boolean;
  reason?: string;
}

/** 단일 케이스의 전체 eval 결과 */
export interface CaseResult<TInput = string, TExpected = unknown> {
  case: EvalCase<TInput, TExpected>;
  output: unknown;
  scores: Record<string, ScoreResult>;
  durationMs: number;
  costUsd?: number;
  error?: string;
}

/** 전체 eval 리포트 */
export interface EvalReport<TInput = string, TExpected = unknown> {
  dataset: string;
  timestamp: string;
  results: CaseResult<TInput, TExpected>[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
    totalCostUsd: number;
    totalDurationMs: number;
  };
}

/** 에이전트 실행 함수 시그니처 */
export type AgentFn<TInput> = (
  input: TInput
) => Promise<{ output: unknown; costUsd?: number }>;

/** scorer 함수 시그니처 */
export type Scorer<TExpected = unknown> = (
  output: unknown,
  expected: TExpected
) => ScoreResult;

/** runEval 옵션 */
export interface RunEvalOptions<TInput, TExpected> {
  dataset: EvalDataset<TInput, TExpected>;
  agent: AgentFn<TInput>;
  scorers: Record<string, Scorer<TExpected>>;
  timeout?: number;
  maxCost?: number;
  tags?: string[];
}
