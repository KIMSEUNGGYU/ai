// ── 비용 추적 쿼리 ──
// 기존 세션 토큰 데이터를 활용하여 비용을 산출한다.

import { getDb } from "./db";
import { calculateSessionCost, getAllModelPricing, type CostBreakdown } from "./pricing";
import type {
  CostSummary,
  ModelCostBreakdown,
  DailyCost,
  CostResponse,
  FilterParams,
} from "./types";

interface SessionTokenRow {
  session_id: string;
  model: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  total_cache_create_tokens: number | null;
  total_cache_read_tokens: number | null;
  num_turns: number | null;
  started_at: string;
  user_id: string;
}

/**
 * 필터 조건에 맞는 토큰 데이터가 있는 세션 목록 조회
 */
function getSessionsWithTokens(filters?: FilterParams, days?: number): SessionTokenRow[] {
  const db = getDb();
  const conditions: string[] = ["total_input_tokens IS NOT NULL"];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push("user_id = ?");
    params.push(filters.userId);
  }

  if (days && days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    conditions.push("started_at > ?");
    params.push(since);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  return db
    .prepare(`
      SELECT
        session_id, model, total_input_tokens, total_output_tokens,
        total_cache_create_tokens, total_cache_read_tokens,
        num_turns, started_at, user_id
      FROM sessions
      ${where}
      ORDER BY started_at DESC
    `)
    .all(...params) as SessionTokenRow[];
}

/**
 * 전체 비용 요약 산출
 */
export function getCostSummary(filters?: FilterParams, days?: number): CostSummary {
  const sessions = getSessionsWithTokens(filters, days);

  let inputCost = 0;
  let outputCost = 0;
  let cacheWriteCost = 0;
  let cacheReadCost = 0;
  let totalTurns = 0;

  for (const session of sessions) {
    const cost = calculateSessionCost(session);
    inputCost += cost.inputCost;
    outputCost += cost.outputCost;
    cacheWriteCost += cost.cacheWriteCost;
    cacheReadCost += cost.cacheReadCost;
    totalTurns += session.num_turns ?? 0;
  }

  const totalCost = inputCost + outputCost + cacheWriteCost + cacheReadCost;
  const sessionCount = sessions.length;

  return {
    totalCost,
    inputCost,
    outputCost,
    cacheWriteCost,
    cacheReadCost,
    sessionCount,
    avgCostPerSession: sessionCount > 0 ? totalCost / sessionCount : 0,
    avgCostPerTurn: totalTurns > 0 ? totalCost / totalTurns : 0,
    totalTurns,
  };
}

/**
 * 모델별 비용 내역 산출
 */
export function getCostByModel(filters?: FilterParams, days?: number): ModelCostBreakdown[] {
  const sessions = getSessionsWithTokens(filters, days);

  // 모델별 그룹핑
  const modelMap = new Map<
    string,
    {
      costs: CostBreakdown[];
      totalTokens: number;
      sessionCount: number;
    }
  >();

  for (const session of sessions) {
    const cost = calculateSessionCost(session);
    const key = cost.modelDisplayName;

    if (!modelMap.has(key)) {
      modelMap.set(key, { costs: [], totalTokens: 0, sessionCount: 0 });
    }

    const entry = modelMap.get(key)!;
    entry.costs.push(cost);
    entry.sessionCount += 1;
    entry.totalTokens +=
      (session.total_input_tokens ?? 0) +
      (session.total_output_tokens ?? 0) +
      (session.total_cache_create_tokens ?? 0) +
      (session.total_cache_read_tokens ?? 0);
  }

  const result: ModelCostBreakdown[] = [];

  for (const [displayName, entry] of modelMap) {
    let inputCost = 0;
    let outputCost = 0;
    let cacheWriteCost = 0;
    let cacheReadCost = 0;

    for (const cost of entry.costs) {
      inputCost += cost.inputCost;
      outputCost += cost.outputCost;
      cacheWriteCost += cost.cacheWriteCost;
      cacheReadCost += cost.cacheReadCost;
    }

    result.push({
      modelId: entry.costs[0].model,
      displayName,
      totalCost: inputCost + outputCost + cacheWriteCost + cacheReadCost,
      inputCost,
      outputCost,
      cacheWriteCost,
      cacheReadCost,
      sessionCount: entry.sessionCount,
      totalTokens: entry.totalTokens,
      isKnownModel: entry.costs[0].isKnownModel,
    });
  }

  // 비용 높은 순으로 정렬
  return result.sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * 일별 비용 추이
 */
export function getDailyCosts(filters?: FilterParams, days: number = 30): DailyCost[] {
  const sessions = getSessionsWithTokens(filters, days);

  // 날짜별 그룹핑
  const dateMap = new Map<string, { totalCost: number; sessionCount: number }>();

  for (const session of sessions) {
    const date = session.started_at.slice(0, 10); // YYYY-MM-DD
    const cost = calculateSessionCost(session);

    if (!dateMap.has(date)) {
      dateMap.set(date, { totalCost: 0, sessionCount: 0 });
    }

    const entry = dateMap.get(date)!;
    entry.totalCost += cost.totalCost;
    entry.sessionCount += 1;
  }

  // 날짜 순으로 정렬
  return Array.from(dateMap.entries())
    .map(([date, entry]) => ({
      date,
      totalCost: entry.totalCost,
      sessionCount: entry.sessionCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 전체 비용 응답 데이터 생성
 */
export function getCostResponse(filters?: FilterParams, days?: number): CostResponse {
  return {
    summary: getCostSummary(filters, days),
    byModel: getCostByModel(filters, days),
    daily: getDailyCosts(filters, days ?? 30),
    pricingTable: getAllModelPricing(),
  };
}
