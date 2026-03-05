/**
 * Demo Mode용 mock 데이터
 * Vercel 배포 시 better-sqlite3를 사용할 수 없으므로 UI 데모용 데이터를 반환한다.
 */
import type {
  StoredEvent,
  Session,
  ToolUsageStat,
  ToolDurationStat,
  HourlyActivity,
  UserSummary,
  TokenUsageSummary,
  AdoptionSummary,
  ActiveUsersMetric,
  SessionFrequencyMetric,
  FeatureUsageMetric,
  EngagementMetric,
  RetentionMetric,
  AdoptionSnapshot,
  PromptLogListResponse,
  PromptLogDetail,
  CostSummary,
  ModelCostBreakdown,
  DailyCost,
  CostResponse,
} from "./types";
import { getAllModelPricing } from "./pricing";

const now = new Date();
const iso = (hoursAgo: number) =>
  new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
const dateStr = (daysAgo: number) =>
  new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// ── Sessions ──

export const mockSessions: Session[] = [
  {
    session_id: "demo-session-1",
    user_id: "alice",
    project_path: "/projects/web-app",
    model: "claude-sonnet-4-20250514",
    permission_mode: "default",
    started_at: iso(1),
    ended_at: null,
    event_count: 42,
    tool_count: 18,
    status: "active",
    transcript_path: null,
    total_input_tokens: 125000,
    total_output_tokens: 48000,
    total_cache_create_tokens: 30000,
    total_cache_read_tokens: 85000,
    num_turns: 12,
    config: JSON.stringify({ maxTurnCount: 10, systemPromptLength: 2400, mcpServers: ["serena", "filesystem"], hasCustomInstructions: true }),
    tool_summary: JSON.stringify({ Read: 8, Edit: 5, Grep: 3, Bash: 2 }),
    last_event_at: iso(0.1),
  },
  {
    session_id: "demo-session-2",
    user_id: "bob",
    project_path: "/projects/api-server",
    model: "claude-opus-4-6",
    permission_mode: "plan",
    started_at: iso(2),
    ended_at: null,
    event_count: 28,
    tool_count: 10,
    status: "active",
    transcript_path: null,
    total_input_tokens: 210000,
    total_output_tokens: 95000,
    total_cache_create_tokens: 50000,
    total_cache_read_tokens: 120000,
    num_turns: 8,
    config: JSON.stringify({ maxTurnCount: 25, systemPromptLength: 3100, mcpServers: ["linear", "slack"], hasCustomInstructions: false }),
    tool_summary: JSON.stringify({ Bash: 6, Read: 3, Agent: 1 }),
    last_event_at: iso(0.4),
  },
  {
    session_id: "demo-session-3",
    user_id: "alice",
    project_path: "/projects/web-app",
    model: "claude-sonnet-4-20250514",
    permission_mode: "default",
    started_at: iso(5),
    ended_at: iso(3),
    event_count: 65,
    tool_count: 30,
    status: "ended",
    transcript_path: null,
    total_input_tokens: 320000,
    total_output_tokens: 150000,
    total_cache_create_tokens: 80000,
    total_cache_read_tokens: 200000,
    num_turns: 25,
    config: JSON.stringify({ maxTurnCount: 10, systemPromptLength: 1800, mcpServers: ["serena"], hasCustomInstructions: true }),
    tool_summary: JSON.stringify({ Read: 15, Edit: 8, Grep: 4, Write: 2, Skill: 1 }),
    last_event_at: iso(3),
  },
];

// ── Events ──

export const mockEvents: StoredEvent[] = [
  {
    id: 1,
    session_id: "demo-session-1",
    event_type: "PostToolUse",
    user_id: "alice",
    project_path: "/projects/web-app",
    tool_name: "Edit",
    tool_input_summary: "src/components/Button.tsx",
    model: "claude-sonnet-4-20250514",
    prompt_text: null,
    permission_mode: "default",
    tool_use_id: "tu-1",
    tool_duration_ms: 1200,
    timestamp: iso(0.1),
    raw_data: null,
  },
  {
    id: 2,
    session_id: "demo-session-1",
    event_type: "PostToolUse",
    user_id: "alice",
    project_path: "/projects/web-app",
    tool_name: "Read",
    tool_input_summary: "src/lib/api.ts",
    model: "claude-sonnet-4-20250514",
    prompt_text: null,
    permission_mode: "default",
    tool_use_id: "tu-2",
    tool_duration_ms: 340,
    timestamp: iso(0.2),
    raw_data: null,
  },
  {
    id: 3,
    session_id: "demo-session-2",
    event_type: "UserPromptSubmit",
    user_id: "bob",
    project_path: "/projects/api-server",
    tool_name: null,
    tool_input_summary: null,
    model: "claude-opus-4-6",
    prompt_text: "Add error handling to the auth middleware",
    permission_mode: "plan",
    tool_use_id: null,
    tool_duration_ms: null,
    timestamp: iso(0.3),
    raw_data: null,
  },
  {
    id: 4,
    session_id: "demo-session-2",
    event_type: "PostToolUse",
    user_id: "bob",
    project_path: "/projects/api-server",
    tool_name: "Bash",
    tool_input_summary: "npm test",
    model: "claude-opus-4-6",
    prompt_text: null,
    permission_mode: "plan",
    tool_use_id: "tu-3",
    tool_duration_ms: 5200,
    timestamp: iso(0.4),
    raw_data: null,
  },
  {
    id: 5,
    session_id: "demo-session-1",
    event_type: "PostToolUse",
    user_id: "alice",
    project_path: "/projects/web-app",
    tool_name: "Grep",
    tool_input_summary: "search: handleSubmit",
    model: "claude-sonnet-4-20250514",
    prompt_text: null,
    permission_mode: "default",
    tool_use_id: "tu-4",
    tool_duration_ms: 890,
    timestamp: iso(0.5),
    raw_data: null,
  },
];

// ── Tool Usage Stats ──

export const mockToolUsageStats: ToolUsageStat[] = [
  { tool_name: "Read", count: 156, percentage: 32 },
  { tool_name: "Edit", count: 98, percentage: 20 },
  { tool_name: "Bash", count: 72, percentage: 15 },
  { tool_name: "Grep", count: 65, percentage: 13 },
  { tool_name: "Write", count: 45, percentage: 9 },
  { tool_name: "Glob", count: 30, percentage: 6 },
  { tool_name: "Agent", count: 15, percentage: 3 },
  { tool_name: "WebSearch", count: 8, percentage: 2 },
];

export const mockToolDurationStats: ToolDurationStat[] = [
  { tool_name: "Bash", avg_ms: 4200, max_ms: 32000, count: 72 },
  { tool_name: "Agent", avg_ms: 3500, max_ms: 15000, count: 15 },
  { tool_name: "Edit", avg_ms: 1100, max_ms: 3200, count: 98 },
  { tool_name: "Grep", avg_ms: 800, max_ms: 2500, count: 65 },
  { tool_name: "Read", avg_ms: 350, max_ms: 1200, count: 156 },
  { tool_name: "Glob", avg_ms: 280, max_ms: 900, count: 30 },
  { tool_name: "Write", avg_ms: 250, max_ms: 800, count: 45 },
];

// ── Hourly Activity ──

export const mockHourlyActivity: HourlyActivity[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  count: hour >= 9 && hour <= 18
    ? Math.floor(Math.random() * 30) + 10
    : Math.floor(Math.random() * 5),
}));

// ── User Summaries ──

export const mockUserSummaries: UserSummary[] = [
  { user_id: "alice", active_sessions: 1, total_events: 107, last_activity: iso(0.1) },
  { user_id: "bob", active_sessions: 1, total_events: 28, last_activity: iso(0.3) },
  { user_id: "charlie", active_sessions: 0, total_events: 45, last_activity: iso(6) },
];

// ── Token Usage ──

export const mockTokenUsage: TokenUsageSummary = {
  input_tokens: 655000,
  output_tokens: 293000,
  cache_create_tokens: 160000,
  cache_read_tokens: 405000,
  turns: 45,
  session_count: 3,
};

// ── Adoption ──

const mockTrend: ActiveUsersMetric[] = Array.from({ length: 14 }, (_, i) => ({
  period: "day" as const,
  period_start: dateStr(13 - i),
  active_users: Math.floor(Math.random() * 3) + 1,
  total_sessions: Math.floor(Math.random() * 8) + 2,
  avg_sessions_per_user: Math.round((Math.random() * 3 + 1) * 10) / 10,
}));

const mockTopTools: FeatureUsageMetric[] = [
  { tool_name: "Read", unique_users: 3, adoption_rate: 100, total_uses: 156, avg_uses_per_user: 52 },
  { tool_name: "Edit", unique_users: 3, adoption_rate: 100, total_uses: 98, avg_uses_per_user: 32.7 },
  { tool_name: "Bash", unique_users: 2, adoption_rate: 67, total_uses: 72, avg_uses_per_user: 36 },
  { tool_name: "Grep", unique_users: 2, adoption_rate: 67, total_uses: 65, avg_uses_per_user: 32.5 },
  { tool_name: "Write", unique_users: 2, adoption_rate: 67, total_uses: 45, avg_uses_per_user: 22.5 },
  { tool_name: "Glob", unique_users: 1, adoption_rate: 33, total_uses: 30, avg_uses_per_user: 30 },
  { tool_name: "Agent", unique_users: 1, adoption_rate: 33, total_uses: 15, avg_uses_per_user: 15 },
];

export const mockAdoptionSummary: AdoptionSummary = {
  active_users: { daily: 2, weekly: 3, monthly: 3 },
  total_users: 3,
  total_sessions: 15,
  avg_session_duration_min: 28.5,
  avg_daily_sessions_per_user: 2.3,
  top_tools: mockTopTools,
  trend: mockTrend,
};

// ── Adoption sub-metrics ──

export const mockActiveUsersMetrics: ActiveUsersMetric[] = mockTrend;

export const mockSessionFrequencyMetrics: SessionFrequencyMetric[] = [
  { user_id: "alice", session_count: 8, avg_duration_min: 32.5, avg_turns_per_session: 18.5, avg_events_per_session: 35.2, last_active: iso(0.1), active_days: 6 },
  { user_id: "bob", session_count: 5, avg_duration_min: 22.1, avg_turns_per_session: 10.4, avg_events_per_session: 20.8, last_active: iso(0.3), active_days: 4 },
  { user_id: "charlie", session_count: 2, avg_duration_min: 15.0, avg_turns_per_session: 6.0, avg_events_per_session: 12.5, last_active: iso(6), active_days: 2 },
];

export const mockFeatureUsageMetrics: FeatureUsageMetric[] = mockTopTools;

export const mockEngagementMetrics: EngagementMetric[] = [
  { user_id: "alice", unique_tools_used: 7, total_events: 107, total_sessions: 8, avg_tool_diversity: 5.2, total_turns: 148 },
  { user_id: "bob", unique_tools_used: 5, total_events: 28, total_sessions: 5, avg_tool_diversity: 3.8, total_turns: 52 },
  { user_id: "charlie", unique_tools_used: 3, total_events: 45, total_sessions: 2, avg_tool_diversity: 2.5, total_turns: 12 },
];

export const mockRetentionMetrics: RetentionMetric[] = [
  { cohort_start: "2026-W08", weeks_after: 0, retained_users: 3, cohort_size: 3, retention_rate: 100 },
  { cohort_start: "2026-W08", weeks_after: 1, retained_users: 3, cohort_size: 3, retention_rate: 100 },
  { cohort_start: "2026-W08", weeks_after: 2, retained_users: 2, cohort_size: 3, retention_rate: 67 },
  { cohort_start: "2026-W08", weeks_after: 3, retained_users: 2, cohort_size: 3, retention_rate: 67 },
];

export const mockAdoptionSnapshots: AdoptionSnapshot[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  snapshot_date: dateStr(6 - i),
  period: "day" as const,
  active_users: Math.floor(Math.random() * 3) + 1,
  total_sessions: Math.floor(Math.random() * 8) + 2,
  total_users: 3,
  avg_session_duration_min: Math.round(Math.random() * 30 + 10),
  avg_sessions_per_user: Math.round((Math.random() * 3 + 1) * 10) / 10,
  avg_turns_per_session: Math.round((Math.random() * 15 + 5) * 10) / 10,
  top_tools_json: JSON.stringify(mockTopTools.slice(0, 5)),
  created_at: dateStr(6 - i),
}));

// ── Prompt Logs ──

export const mockPromptLogListResponse: PromptLogListResponse = {
  logs: [
    {
      id: 1,
      session_id: "demo-session-1",
      user_id: "alice",
      project_path: "/projects/web-app",
      prompt_text: "Refactor the Button component to use Tailwind classes",
      model: "claude-sonnet-4-20250514",
      timestamp: iso(0.5),
      input_tokens: 12000,
      output_tokens: 4500,
      cost_usd: 0.103,
      duration_ms: 8500,
      turn_number: 1,
      session_model: "claude-sonnet-4-20250514",
      session_status: "active",
    },
    {
      id: 2,
      session_id: "demo-session-2",
      user_id: "bob",
      project_path: "/projects/api-server",
      prompt_text: "Add error handling to the auth middleware",
      model: "claude-opus-4-6",
      timestamp: iso(0.3),
      input_tokens: 25000,
      output_tokens: 12000,
      cost_usd: 1.275,
      duration_ms: 15000,
      turn_number: 1,
      session_model: "claude-opus-4-6",
      session_status: "active",
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
};

export const mockPromptLogUsers: string[] = ["alice", "bob", "charlie"];
export const mockPromptLogProjects: string[] = ["/projects/web-app", "/projects/api-server"];

// ── Cost ──

export const mockCostSummary: CostSummary = {
  totalCost: 12.45,
  inputCost: 3.28,
  outputCost: 7.12,
  cacheWriteCost: 1.05,
  cacheReadCost: 1.0,
  sessionCount: 15,
  avgCostPerSession: 0.83,
  avgCostPerTurn: 0.28,
  totalTurns: 45,
};

export const mockCostByModel: ModelCostBreakdown[] = [
  {
    modelId: "claude-opus-4-6",
    displayName: "Claude Opus 4.6",
    totalCost: 8.5,
    inputCost: 2.1,
    outputCost: 5.2,
    cacheWriteCost: 0.7,
    cacheReadCost: 0.5,
    sessionCount: 5,
    totalTokens: 890000,
    isKnownModel: true,
  },
  {
    modelId: "claude-sonnet-4-20250514",
    displayName: "Claude Sonnet 4",
    totalCost: 3.95,
    inputCost: 1.18,
    outputCost: 1.92,
    cacheWriteCost: 0.35,
    cacheReadCost: 0.5,
    sessionCount: 10,
    totalTokens: 1250000,
    isKnownModel: true,
  },
];

export const mockDailyCosts: DailyCost[] = Array.from({ length: 14 }, (_, i) => ({
  date: dateStr(13 - i),
  totalCost: Math.round((Math.random() * 2 + 0.3) * 100) / 100,
  sessionCount: Math.floor(Math.random() * 5) + 1,
}));

export const mockCostResponse: CostResponse = {
  summary: mockCostSummary,
  byModel: mockCostByModel,
  daily: mockDailyCosts,
  pricingTable: getAllModelPricing(),
};
