/** 평가 결과 */
export interface EvalResult {
  pass: boolean;
  feedback: string;
  details?: Record<string, boolean>;
}

/** 에이전트 실행 결과 */
export interface AgentResult {
  output: string;
  sessionId?: string;
  turns: number;
  cost: number;
}

/** Spec Agent 입력 — 기획문서 기반 */
export interface SpecInput {
  /** 기획문서 내용 (텍스트) */
  planningDoc: string;
  /** Linear 티켓 ID (선택 — 추가 맥락 조회용) */
  ticketId?: string;
  /** 디자인 입력 (레이아웃/컴포넌트 배치 등) */
  designInput?: string;
}

/** fe-auto 파이프라인 입력 */
export interface FeAutoInput {
  /** 스펙 파일 경로 (직접 작성한 스펙) 또는 기획문서 경로 */
  specPath: string;
  /** FE 프로젝트 경로 */
  projectPath: string;
  /** Linear 티켓 ID (선택) */
  ticketId?: string;
  /** 기획문서 → 스펙 변환 모드 (true면 Spec Agent 경유) */
  convertSpec?: boolean;
}

/** 파이프라인 상태 */
export interface PipelineState {
  input: FeAutoInput;
  spec: string;
  reviewResult?: string;
}
