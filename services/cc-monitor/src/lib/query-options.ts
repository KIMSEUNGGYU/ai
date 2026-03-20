import { queryOptions } from "@tanstack/react-query";
import {
  fetchSessions,
  fetchFeed,
  fetchAnalytics,
  fetchCost,
  fetchSessionEvents,
  fetchConfig,
} from "./remotes";

export interface GlobalFilterParams {
  userId?: string;
  toolName?: string;
  days?: number;
}

// ── sessions ──

export const sessionsQueryOptions = (params: GlobalFilterParams = {}) =>
  queryOptions({
    queryKey: ["sessions", params],
    queryFn: () => fetchSessions({ status: "all", ...params }),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

// ── feed ──

export const feedQueryOptions = (params: GlobalFilterParams = {}) =>
  queryOptions({
    queryKey: ["feed", params],
    queryFn: () => fetchFeed({ limit: 30, ...params }),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

// ── analytics ──

export const analyticsQueryOptions = (params: GlobalFilterParams = {}) =>
  queryOptions({
    queryKey: ["analytics", params],
    queryFn: () => fetchAnalytics(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

// ── cost ──

export const costQueryOptions = (params: { userId?: string; days?: number } = {}) =>
  queryOptions({
    queryKey: ["cost", params],
    queryFn: () => fetchCost(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

// ── session events ──

export const sessionEventsQueryOptions = (sessionId: string) =>
  queryOptions({
    queryKey: ["sessionEvents", sessionId],
    queryFn: () => fetchSessionEvents(sessionId),
    enabled: !!sessionId,
  });

// ── config ──

export const configQueryOptions = () =>
  queryOptions({
    queryKey: ["config"],
    queryFn: fetchConfig,
    staleTime: 60_000,
  });
