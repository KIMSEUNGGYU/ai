// ── Hook 이벤트 타입 (Claude Code stdin JSON) ──

export type HookEventName =
  | "SessionStart"
  | "SessionEnd"
  | "PreToolUse"
  | "PostToolUse"
  | "UserPromptSubmit"
  | "Stop"
  | "Notification"
  | "SubagentStart"
  | "SubagentStop"
  | "PreCompact"
  | "PluginHook";

export interface HookEventBase {
  session_id: string;
  transcript_path?: string;
  cwd: string;
  permission_mode?: string;
  hook_event_name: HookEventName;
}

export interface SessionStartEvent extends HookEventBase {
  hook_event_name: "SessionStart";
  source?: "startup" | "resume" | "clear" | "compact";
  model?: string;
}

export interface SessionEndEvent extends HookEventBase {
  hook_event_name: "SessionEnd";
  reason?: string;
}

export interface ToolUseEvent extends HookEventBase {
  hook_event_name: "PreToolUse" | "PostToolUse";
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_use_id?: string;
}

export interface UserPromptSubmitEvent extends HookEventBase {
  hook_event_name: "UserPromptSubmit";
  prompt?: string;
}

export interface StopEvent extends HookEventBase {
  hook_event_name: "Stop";
  stop_hook_active?: boolean;
  last_assistant_message?: string;
  transcript_path?: string;
}

export interface PluginHookEvent extends HookEventBase {
  hook_event_name: "PluginHook";
  /** 플러그인 이름 (e.g. "fe-workflow") */
  plugin_name: string;
  /** hook 이름 (e.g. "fe-convention-prompt", "post-edit-convention") */
  hook_name: string;
  /** 주입된 컨벤션 파일 목록 */
  injected_conventions?: string[];
  /** 매칭된 키워드 */
  matched_keywords?: string[];
  /** 주입된 컨벤션 파일별 바이트 수 */
  injection_bytes?: number[];
  /** 주입된 컨벤션 총 바이트 수 */
  injection_total_bytes?: number;
  /** 주입된 컨벤션 내용의 md5 해시 (파일 변경 감지용) */
  injection_hash?: string;
  /** 대상 파일 (PostToolUse hook인 경우) */
  target_file?: string;
}

export type HookEvent =
  | SessionStartEvent
  | SessionEndEvent
  | ToolUseEvent
  | UserPromptSubmitEvent
  | StopEvent
  | PluginHookEvent
  | (HookEventBase & Record<string, unknown>);

// ── 저장용 타입 ──

export interface StoredEvent {
  id?: number;
  session_id: string;
  event_type: HookEventName;
  user_id: string;
  project_path: string;
  tool_name: string | null;
  tool_input_summary: string | null;
  model: string | null;
  prompt_text: string | null;
  permission_mode: string | null;
  tool_use_id: string | null;
  tool_duration_ms: number | null;
  timestamp: string;
  raw_data: string | null;
}

export interface Session {
  session_id: string;
  user_id: string;
  project_path: string;
  model: string | null;
  permission_mode: string | null;
  started_at: string;
  ended_at: string | null;
  event_count: number;
  tool_count: number;
  status: "active" | "ended";
  transcript_path: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  total_cache_create_tokens: number | null;
  total_cache_read_tokens: number | null;
  num_turns: number | null;
  config: string | null;
  tool_summary: string | null;
  task_name: string | null;
  last_event_at: string | null;
}

// ── 분석 타입 ──

export interface ToolUsageStat {
  tool_name: string;
  count: number;
  percentage: number;
}

export interface HourlyActivity {
  hour: number;
  count: number;
}

export interface UserSummary {
  user_id: string;
  active_sessions: number;
  total_events: number;
  last_activity: string;
}

export interface ToolDurationStat {
  tool_name: string;
  avg_ms: number;
  max_ms: number;
  count: number;
}

export interface TokenUsageSummary {
  input_tokens: number;
  output_tokens: number;
  cache_create_tokens: number;
  cache_read_tokens: number;
  turns: number;
  session_count: number;
}

// ── 프롬프트 로그 (dedicated prompt_logs table) ──

/** prompt_logs 테이블 DB 레코드 (저장/삽입용) */
export interface PromptLogRecord {
  id?: number;
  session_id: string;
  event_id: number | null;
  user_id: string;
  project_path: string | null;
  prompt_text: string;
  response_text: string | null;
  model: string | null;
  permission_mode: string | null;
  timestamp: string;
  response_timestamp: string | null;
  duration_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_create_tokens: number | null;
  cache_read_tokens: number | null;
  turn_number: number | null;
  cost_usd: number | null;
  created_at?: string;
}

/** POST /api/prompt-logs 요청 바디 */
export interface PromptLogInput {
  /** 세션 ID (필수) */
  session_id: string;
  /** 프롬프트 텍스트 (필수) */
  prompt_text: string;
  /** 사용자 ID (선택, 헤더 x-cc-user 로도 전달 가능) */
  user_id?: string;
  /** 프로젝트 경로 */
  project_path?: string;
  /** 모델명 */
  model?: string;
  /** 권한 모드 */
  permission_mode?: string;
  /** 이벤트 시점 (ISO 8601, 미지정 시 서버 현재 시각) */
  timestamp?: string;
  /** 원본 데이터 (JSON stringify 가능한 추가 메타데이터) */
  raw_data?: Record<string, unknown>;
}

/** insertPromptLog 반환 타입 */
export interface PromptLogInsertResult {
  id: number;
  session_id: string;
  timestamp: string;
}

/** 프롬프트 로그 목록 조회용 (세션 정보 JOIN) */
export interface PromptLog {
  id: number;
  session_id: string;
  user_id: string;
  project_path: string;
  prompt_text: string;
  model: string | null;
  timestamp: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  turn_number: number | null;
  session_model: string | null;
  session_status: string | null;
}

/** 프롬프트 로그 상세 조회 (응답 포함) */
export interface PromptLogDetail extends PromptLog {
  event_id: number | null;
  permission_mode: string | null;
  session_started_at: string | null;
  session_ended_at: string | null;
  response_text: string | null;
  response_timestamp: string | null;
  cache_create_tokens: number | null;
  cache_read_tokens: number | null;
  /** 세션 전체 input 토큰 (sessions 테이블 참조) */
  total_input_tokens: number | null;
  /** 세션 전체 output 토큰 (sessions 테이블 참조) */
  total_output_tokens: number | null;
}

/** 프롬프트 로그 조회 필터 */
export interface PromptLogFilters {
  userId?: string;
  search?: string;
  sessionId?: string;
  projectPath?: string;
  model?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/** 프롬프트 로그 목록 API 응답 */
export interface PromptLogListResponse {
  logs: PromptLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** 프롬프트 로그 통계 요약 */
export interface PromptLogStats {
  total_prompts: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  avg_duration_ms: number;
  avg_tokens_per_prompt: number;
  unique_users: number;
  unique_sessions: number;
}

// ── 비용 추적 ──

export interface CostSummary {
  /** 총 비용 (USD) */
  totalCost: number;
  /** Input 토큰 비용 */
  inputCost: number;
  /** Output 토큰 비용 */
  outputCost: number;
  /** Cache Write 비용 */
  cacheWriteCost: number;
  /** Cache Read 비용 */
  cacheReadCost: number;
  /** 총 세션 수 */
  sessionCount: number;
  /** 세션당 평균 비용 */
  avgCostPerSession: number;
  /** 턴당 평균 비용 */
  avgCostPerTurn: number;
  /** 총 턴 수 */
  totalTurns: number;
}

export interface ModelCostBreakdown {
  /** 모델 ID */
  modelId: string;
  /** 모델 표시 이름 */
  displayName: string;
  /** 해당 모델 총 비용 */
  totalCost: number;
  /** Input 비용 */
  inputCost: number;
  /** Output 비용 */
  outputCost: number;
  /** Cache Write 비용 */
  cacheWriteCost: number;
  /** Cache Read 비용 */
  cacheReadCost: number;
  /** 해당 모델 세션 수 */
  sessionCount: number;
  /** 총 토큰 수 */
  totalTokens: number;
  /** 알려진 모델 여부 */
  isKnownModel: boolean;
}

export interface DailyCost {
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 해당 날짜 총 비용 */
  totalCost: number;
  /** 세션 수 */
  sessionCount: number;
}

export interface CostResponse {
  /** 전체 비용 요약 */
  summary: CostSummary;
  /** 모델별 비용 내역 */
  byModel: ModelCostBreakdown[];
  /** 일별 비용 추이 */
  daily: DailyCost[];
  /** 단가 테이블 정보 */
  pricingTable: Array<{
    modelId: string;
    displayName: string;
    inputPerMTok: number;
    outputPerMTok: number;
    cacheWritePerMTok: number;
    cacheReadPerMTok: number;
  }>;
}

// ── 채택률 메트릭 (Adoption Metrics) ──

/** 기간 구분: 일/주/월 단위 집계 */
export type AdoptionPeriod = "day" | "week" | "month";

/** DAU/WAU/MAU 활성 사용자 메트릭 */
export interface ActiveUsersMetric {
  period: AdoptionPeriod;
  /** 기간 시작 시점 (ISO 8601, e.g. "2026-03-04") */
  period_start: string;
  /** 해당 기간의 고유 활성 사용자 수 */
  active_users: number;
  /** 해당 기간의 총 세션 수 */
  total_sessions: number;
  /** 사용자당 평균 세션 수 */
  avg_sessions_per_user: number;
}

/** 사용자별 세션 빈도 메트릭 */
export interface SessionFrequencyMetric {
  user_id: string;
  /** 기간 내 총 세션 수 */
  session_count: number;
  /** 평균 세션 시간 (분, ended_at - started_at 기준) */
  avg_duration_min: number;
  /** 세션당 평균 턴 수 */
  avg_turns_per_session: number;
  /** 세션당 평균 이벤트 수 */
  avg_events_per_session: number;
  /** 마지막 활동 시점 */
  last_active: string;
  /** 활동 일수 (세션이 있는 고유 날짜 수) */
  active_days: number;
}

/** 기능(도구)별 채택률 메트릭 */
export interface FeatureUsageMetric {
  tool_name: string;
  /** 해당 도구를 사용한 고유 사용자 수 */
  unique_users: number;
  /** 전체 활성 사용자 대비 채택률 (0-100%) */
  adoption_rate: number;
  /** 총 사용 횟수 */
  total_uses: number;
  /** 사용자당 평균 사용 횟수 */
  avg_uses_per_user: number;
}

/** 사용자별 참여 깊이(engagement depth) 메트릭 */
export interface EngagementMetric {
  user_id: string;
  /** 사용한 고유 도구 종류 수 */
  unique_tools_used: number;
  /** 총 이벤트 수 */
  total_events: number;
  /** 총 세션 수 */
  total_sessions: number;
  /** 세션당 평균 도구 종류 수 */
  avg_tool_diversity: number;
  /** 총 턴 수 */
  total_turns: number;
}

/** 사용자 리텐션(재사용) 메트릭 */
export interface RetentionMetric {
  /** 코호트 기간 시작 (ISO 8601, e.g. "2026-W10") */
  cohort_start: string;
  /** 첫 활동 후 경과 주 수 */
  weeks_after: number;
  /** 해당 코호트에서 재방문한 사용자 수 */
  retained_users: number;
  /** 코호트 전체 사용자 수 */
  cohort_size: number;
  /** 리텐션율 (0-100%) */
  retention_rate: number;
}

/** 전체 채택률 요약 대시보드 데이터 */
export interface AdoptionSummary {
  /** DAU/WAU/MAU 수치 */
  active_users: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  /** 전체 관측된 고유 사용자 수 */
  total_users: number;
  /** 전체 세션 수 */
  total_sessions: number;
  /** 평균 세션 시간 (분) */
  avg_session_duration_min: number;
  /** 사용자당 평균 일일 세션 수 */
  avg_daily_sessions_per_user: number;
  /** 도구 채택률 Top N */
  top_tools: FeatureUsageMetric[];
  /** 기간별 활성 사용자 트렌드 (최근 N 기간) */
  trend: ActiveUsersMetric[];
}

/** 채택률 스냅샷 (DB 저장용, 집계 캐시) */
export interface AdoptionSnapshot {
  id?: number;
  /** 스냅샷 생성 일자 (YYYY-MM-DD) */
  snapshot_date: string;
  period: AdoptionPeriod;
  active_users: number;
  total_sessions: number;
  total_users: number;
  avg_session_duration_min: number;
  avg_sessions_per_user: number;
  avg_turns_per_session: number;
  /** JSON-serialized FeatureUsageMetric[] (top 10) */
  top_tools_json: string;
  created_at?: string;
}

// ── 필터 ──

export interface FilterParams {
  userId?: string;
  toolName?: string;
  days?: number;
  minEvents?: number;
}

export interface AdoptionFilterParams {
  userId?: string;
  period?: AdoptionPeriod;
  /** 조회 시작일 (ISO 8601) */
  since?: string;
  /** 조회 종료일 (ISO 8601) */
  until?: string;
}
