import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import {
  fetchSessions,
  fetchAnalytics,
  fetchCost,
  fetchSessionEvents,
  fetchHarness,
  fetchAdoption,
} from "./remotes";

export interface GlobalFilterParams {
  userId?: string;
  toolName?: string;
  days?: number;
  minEvents?: number;
}

// ── sessions ──

export const sessionsQueryOptions = (params: GlobalFilterParams = {}) =>
  queryOptions({
    queryKey: ["sessions", params],
    queryFn: () => fetchSessions({ status: "all", ...params }),
    staleTime: 10_000,
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

// ── analytics ──

export const analyticsQueryOptions = (params: GlobalFilterParams = {}) =>
  queryOptions({
    queryKey: ["analytics", params],
    queryFn: () => fetchAnalytics(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });

// ── cost ──

export const costQueryOptions = (params: { userId?: string; days?: number } = {}) =>
  queryOptions({
    queryKey: ["cost", params],
    queryFn: () => fetchCost(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });

// ── harness ──

export const harnessQueryOptions = (params: { days?: number } = {}) =>
  queryOptions({
    queryKey: ["harness", params],
    queryFn: () => fetchHarness(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });

// ── adoption ──

export const adoptionQueryOptions = (params: { period?: string; days?: number } = {}) =>
  queryOptions({
    queryKey: ["adoption", params],
    queryFn: () => fetchAdoption(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

// ── session events ──

export const sessionEventsQueryOptions = (sessionId: string) =>
  queryOptions({
    queryKey: ["sessionEvents", sessionId],
    queryFn: () => fetchSessionEvents(sessionId),
    enabled: !!sessionId,
  });
