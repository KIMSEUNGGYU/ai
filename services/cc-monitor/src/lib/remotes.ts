import { apiClient } from "./api-client";
import type {
  Session,
  StoredEvent,
  ToolUsageStat,
  ToolDurationStat,
  HourlyActivity,
  UserSummary,
  TokenUsageSummary,
  CostResponse,
  AdoptionSummary,
  AdoptionPeriod,
  ActiveUsersMetric,
  SessionFrequencyMetric,
  FeatureUsageMetric,
  EngagementMetric,
  RetentionMetric,
  AdoptionSnapshot,
} from "./types";

// ── helpers ──

/** undefined 값을 제외한 searchParams 객체 생성 */
function cleanParams(obj: Record<string, string | number | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) result[k] = String(v);
  }
  return result;
}

// ── GET /api/sessions — sessions ──

export interface FetchSessionsParams {
  status?: string;
  userId?: string;
  toolName?: string;
  days?: number;
}

export async function fetchSessions(params: FetchSessionsParams = {}): Promise<Session[]> {
  const searchParams = cleanParams({
    status: params.status ?? "all",
    userId: params.userId,
    toolName: params.toolName,
    days: params.days,
  });
  const data = await apiClient.get("sessions", { searchParams }).json<{ sessions: Session[] }>();
  return data.sessions;
}

// ── GET /api/feed — feed ──

export interface FetchFeedParams {
  limit?: number;
  userId?: string;
  toolName?: string;
  days?: number;
}

export async function fetchFeed(params: FetchFeedParams = {}): Promise<StoredEvent[]> {
  const searchParams = cleanParams({
    limit: params.limit ?? 30,
    userId: params.userId,
    toolName: params.toolName,
    days: params.days,
  });
  const data = await apiClient.get("feed", { searchParams }).json<{ events: StoredEvent[] }>();
  return data.events;
}

// ── GET /api/analytics — analytics ──

export interface FetchAnalyticsParams {
  userId?: string;
  toolName?: string;
  days?: number;
}

export interface AnalyticsResponse {
  tools: ToolUsageStat[];
  toolDurations: ToolDurationStat[];
  hourly: HourlyActivity[];
  users: UserSummary[];
  tokenUsage: TokenUsageSummary;
}

export async function fetchAnalytics(params: FetchAnalyticsParams = {}): Promise<AnalyticsResponse> {
  const searchParams = cleanParams({
    userId: params.userId,
    toolName: params.toolName,
    days: params.days,
  });
  return apiClient.get("analytics", { searchParams }).json<AnalyticsResponse>();
}

// ── GET /api/cost — cost ──

export interface FetchCostParams {
  userId?: string;
  days?: number;
}

export async function fetchCost(params: FetchCostParams = {}): Promise<CostResponse> {
  const searchParams = cleanParams({
    userId: params.userId,
    days: params.days,
  });
  return apiClient.get("cost", { searchParams }).json<CostResponse>();
}

// ── GET /api/sessions/[id]/events — session events ──

export async function fetchSessionEvents(sessionId: string): Promise<StoredEvent[]> {
  const data = await apiClient.get(`sessions/${sessionId}/events`).json<{ events: StoredEvent[] }>();
  return data.events;
}

// ── GET /api/config — config ──

export async function fetchConfig(): Promise<Record<string, unknown>[]> {
  const data = await apiClient.get("config").json<{ configs: Record<string, unknown>[] }>();
  return data.configs ?? [];
}

// ── GET /api/adoption — adoption metrics ──

export type AdoptionView =
  | "summary"
  | "active-users"
  | "session-frequency"
  | "feature-usage"
  | "engagement"
  | "retention"
  | "snapshots"
  | "snapshot-create";

export interface FetchAdoptionParams {
  view?: AdoptionView;
  period?: AdoptionPeriod;
  userId?: string;
  since?: string;
  until?: string;
  days?: number;
  maxWeeks?: number;
  limit?: number;
}

export async function fetchAdoptionSummary(params: FetchAdoptionParams = {}): Promise<AdoptionSummary> {
  const searchParams = cleanParams({
    view: "summary",
    period: params.period,
    userId: params.userId,
    since: params.since,
    until: params.until,
  });
  return apiClient.get("adoption", { searchParams }).json<AdoptionSummary>();
}

export async function fetchActiveUsersMetrics(params: FetchAdoptionParams = {}): Promise<{
  metrics: ActiveUsersMetric[];
  period: AdoptionPeriod;
}> {
  const searchParams = cleanParams({
    view: "active-users",
    period: params.period,
    userId: params.userId,
    since: params.since,
    until: params.until,
  });
  return apiClient.get("adoption", { searchParams }).json();
}

export async function fetchSessionFrequencyMetrics(params: FetchAdoptionParams = {}): Promise<{
  metrics: SessionFrequencyMetric[];
}> {
  const searchParams = cleanParams({
    view: "session-frequency",
    period: params.period,
    userId: params.userId,
    since: params.since,
    until: params.until,
  });
  return apiClient.get("adoption", { searchParams }).json();
}

export async function fetchFeatureUsageMetrics(params: FetchAdoptionParams = {}): Promise<{
  metrics: FeatureUsageMetric[];
}> {
  const searchParams = cleanParams({
    view: "feature-usage",
    period: params.period,
    userId: params.userId,
    since: params.since,
    until: params.until,
  });
  return apiClient.get("adoption", { searchParams }).json();
}

export async function fetchEngagementMetrics(params: FetchAdoptionParams = {}): Promise<{
  metrics: EngagementMetric[];
}> {
  const searchParams = cleanParams({
    view: "engagement",
    period: params.period,
    userId: params.userId,
    since: params.since,
    until: params.until,
  });
  return apiClient.get("adoption", { searchParams }).json();
}

export async function fetchRetentionMetrics(params: FetchAdoptionParams = {}): Promise<{
  metrics: RetentionMetric[];
}> {
  const searchParams = cleanParams({
    view: "retention",
    period: params.period,
    userId: params.userId,
    since: params.since,
    until: params.until,
    maxWeeks: params.maxWeeks,
  });
  return apiClient.get("adoption", { searchParams }).json();
}

export async function fetchAdoptionSnapshots(params: FetchAdoptionParams = {}): Promise<{
  snapshots: AdoptionSnapshot[];
}> {
  const searchParams = cleanParams({
    view: "snapshots",
    period: params.period,
    limit: params.limit,
  });
  return apiClient.get("adoption", { searchParams }).json();
}
