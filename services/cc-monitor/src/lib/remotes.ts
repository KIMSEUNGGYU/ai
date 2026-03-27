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

// ── GET /api/sessions ──

export interface FetchSessionsParams {
  status?: string;
  userId?: string;
  toolName?: string;
  days?: number;
  minEvents?: number;
}

export async function fetchSessions(params: FetchSessionsParams = {}): Promise<Session[]> {
  const searchParams = cleanParams({
    status: params.status ?? "all",
    userId: params.userId,
    toolName: params.toolName,
    days: params.days,
    minEvents: params.minEvents,
  });
  const data = await apiClient.get("sessions", { searchParams }).json<{ sessions: Session[] }>();
  return data.sessions;
}

// ── GET /api/analytics ──

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

// ── GET /api/cost ──

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

// ── GET /api/harness ──

export interface FetchHarnessParams {
  days?: number;
}

export interface HarnessResponse {
  skills: {
    skills: Array<{ name: string; count: number }>;
    daily: Array<{ date: string; skill: string; count: number }>;
  };
  conventions: {
    conventions: Array<{ name: string; count: number; totalBytes: number; topKeywords: string[] }>;
    daily: Array<{ date: string; convention: string; count: number }>;
  };
  config: {
    timeline: Array<{ date: string; rulesCount: number; hooksCount: number; mcpCount: number; claudeMdCount: number }>;
    changes: Array<{ date: string; type: "added" | "removed"; category: string; item: string }>;
  };
}

export async function fetchHarness(params: FetchHarnessParams = {}): Promise<HarnessResponse> {
  const searchParams = cleanParams({ days: params.days });
  return apiClient.get("harness", { searchParams }).json<HarnessResponse>();
}

// ── /api/adoption ──

export interface AdoptionTimelineEntry {
  id: number;
  snapshot_date: string;
  period: string;
  active_users: number;
  total_sessions: number;
  total_users: number;
  avg_session_duration_min: number;
  avg_sessions_per_user: number;
  avg_turns_per_session: number;
  top_tools_json: string;
}

export async function fetchAdoption(params: { period?: string; days?: number } = {}): Promise<{ timeline: AdoptionTimelineEntry[] }> {
  const searchParams = cleanParams({ period: params.period, days: params.days });
  return apiClient.get("adoption", { searchParams }).json<{ timeline: AdoptionTimelineEntry[] }>();
}

export async function generateAdoptionSnapshot(period: "day" | "week" = "day"): Promise<AdoptionTimelineEntry> {
  return apiClient.post("adoption", { json: { period } }).json<AdoptionTimelineEntry>();
}

// ── GET /api/sessions/[id]/events ──

export async function fetchSessionEvents(sessionId: string): Promise<StoredEvent[]> {
  const data = await apiClient.get(`sessions/${sessionId}/events`).json<{ events: StoredEvent[] }>();
  return data.events;
}
