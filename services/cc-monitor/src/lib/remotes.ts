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

// ── GET /api/sessions/[id]/events ──

export async function fetchSessionEvents(sessionId: string): Promise<StoredEvent[]> {
  const data = await apiClient.get(`sessions/${sessionId}/events`).json<{ events: StoredEvent[] }>();
  return data.events;
}
