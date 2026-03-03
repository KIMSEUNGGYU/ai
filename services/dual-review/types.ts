/** 평가 결과 */
export interface EvalResult {
  pass: boolean;
  feedback: string;
  details?: Record<string, boolean>;
}

/** 에이전트 실행 결과 (Claude Agent SDK) */
export interface AgentResult {
  output: string;
  sessionId?: string;
  turns: number;
  cost: number;
}

/** dual-review 파이프라인 입력 */
export interface DualReviewInput {
  /** 요구사항 (자연어) */
  requirement: string;
  /** 대상 FE 프로젝트 경로 */
  targetProject: string;
}

/** 파이프라인 상태 */
export interface PipelineState {
  input: DualReviewInput;
  designSpec?: string;
  implResult?: string;
  reviewResult?: string;
}

/** Codex 리뷰 이슈 */
export interface ReviewIssue {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

/** Codex 리뷰 결과 (파싱된) */
export interface ReviewResult {
  issues: ReviewIssue[];
  summary: string;
  pass: boolean;
}
