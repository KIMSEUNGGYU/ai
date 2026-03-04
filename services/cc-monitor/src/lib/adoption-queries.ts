/**
 * 채택률(Adoption Rate) 메트릭 수집·집계 쿼리
 *
 * 기존 sessions/events 테이블 데이터를 활용하여
 * DAU/WAU/MAU, 세션 빈도, 기능 채택률, 참여 깊이, 리텐션 등을 계산한다.
 */
import { prisma, isDemoMode } from "./db";
import {
  mockActiveUsersMetrics,
  mockSessionFrequencyMetrics,
  mockFeatureUsageMetrics,
  mockEngagementMetrics,
  mockRetentionMetrics,
  mockAdoptionSummary,
  mockAdoptionSnapshots,
} from "./mock-data";
import type {
  AdoptionPeriod,
  AdoptionFilterParams,
  ActiveUsersMetric,
  SessionFrequencyMetric,
  FeatureUsageMetric,
  EngagementMetric,
  RetentionMetric,
  AdoptionSummary,
  AdoptionSnapshot,
} from "./types";

// ── 헬퍼 ──

/** period → SQLite strftime 포맷 문자열 */
function periodToDateFormat(period: AdoptionPeriod): string {
  switch (period) {
    case "day":
      return "%Y-%m-%d";
    case "week":
      return "%Y-W%W";
    case "month":
      return "%Y-%m";
  }
}

/** period → 기본 조회 기간 (일수) */
function periodToDefaultDays(period: AdoptionPeriod): number {
  switch (period) {
    case "day":
      return 30;
    case "week":
      return 90;
    case "month":
      return 365;
  }
}

/** 날짜 범위 결정 */
function resolveDateRange(filters?: AdoptionFilterParams): {
  since: string;
  until: string;
} {
  const period = filters?.period ?? "day";
  const until = filters?.until ?? new Date().toISOString();
  const since =
    filters?.since ??
    new Date(
      Date.now() - periodToDefaultDays(period) * 24 * 60 * 60 * 1000
    ).toISOString();
  return { since, until };
}

// ── DAU/WAU/MAU 활성 사용자 메트릭 ──

export async function getActiveUsersMetrics(
  filters?: AdoptionFilterParams
): Promise<ActiveUsersMetric[]> {
  if (isDemoMode()) return mockActiveUsersMetrics;
  const db = prisma!;
  const period = filters?.period ?? "day";
  const dateFormat = periodToDateFormat(period);
  const { since, until } = resolveDateRange(filters);

  const conditions: string[] = ["s.started_at >= ?", "s.started_at <= ?"];
  const params: unknown[] = [since, until];

  if (filters?.userId) {
    conditions.push("s.user_id = ?");
    params.push(filters.userId);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await db.$queryRawUnsafe<Array<{
    period_start: string;
    active_users: bigint;
    total_sessions: bigint;
  }>>(
    `SELECT
      strftime('${dateFormat}', s.started_at) as period_start,
      COUNT(DISTINCT s.user_id) as active_users,
      COUNT(*) as total_sessions
    FROM sessions s
    ${where}
    GROUP BY period_start
    ORDER BY period_start ASC`,
    ...params
  );

  return rows.map((row) => ({
    period,
    period_start: row.period_start,
    active_users: Number(row.active_users),
    total_sessions: Number(row.total_sessions),
    avg_sessions_per_user:
      Number(row.active_users) > 0
        ? Math.round((Number(row.total_sessions) / Number(row.active_users)) * 100) / 100
        : 0,
  }));
}

// ── 사용자별 세션 빈도 메트릭 ──

export async function getSessionFrequencyMetrics(
  filters?: AdoptionFilterParams
): Promise<SessionFrequencyMetric[]> {
  if (isDemoMode()) return mockSessionFrequencyMetrics;
  const db = prisma!;
  const { since, until } = resolveDateRange(filters);

  const conditions: string[] = ["s.started_at >= ?", "s.started_at <= ?"];
  const params: unknown[] = [since, until];

  if (filters?.userId) {
    conditions.push("s.user_id = ?");
    params.push(filters.userId);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await db.$queryRawUnsafe<Array<{
    user_id: string;
    session_count: bigint;
    avg_duration_min: number;
    avg_turns_per_session: number;
    avg_events_per_session: number;
    last_active: string;
    active_days: bigint;
  }>>(
    `SELECT
      s.user_id,
      COUNT(*) as session_count,
      COALESCE(
        AVG(
          CASE
            WHEN s.ended_at IS NOT NULL
            THEN (julianday(s.ended_at) - julianday(s.started_at)) * 24 * 60
            ELSE NULL
          END
        ),
        0
      ) as avg_duration_min,
      COALESCE(AVG(s.num_turns), 0) as avg_turns_per_session,
      COALESCE(
        AVG(ec.event_count),
        0
      ) as avg_events_per_session,
      MAX(s.started_at) as last_active,
      COUNT(DISTINCT date(s.started_at)) as active_days
    FROM sessions s
    LEFT JOIN (
      SELECT session_id, COUNT(*) as event_count
      FROM events
      GROUP BY session_id
    ) ec ON s.session_id = ec.session_id
    ${where}
    GROUP BY s.user_id
    ORDER BY session_count DESC`,
    ...params
  );

  return rows.map((row) => ({
    user_id: row.user_id,
    session_count: Number(row.session_count),
    avg_duration_min: Math.round(row.avg_duration_min * 100) / 100,
    avg_turns_per_session: Math.round(row.avg_turns_per_session * 100) / 100,
    avg_events_per_session: Math.round(row.avg_events_per_session * 100) / 100,
    last_active: row.last_active,
    active_days: Number(row.active_days),
  }));
}

// ── 기능(도구)별 채택률 메트릭 ──

export async function getFeatureUsageMetrics(
  filters?: AdoptionFilterParams
): Promise<FeatureUsageMetric[]> {
  if (isDemoMode()) return mockFeatureUsageMetrics;
  const db = prisma!;
  const { since, until } = resolveDateRange(filters);

  // 전체 활성 사용자 수
  const userConditions: string[] = ["started_at >= ?", "started_at <= ?"];
  const userParams: unknown[] = [since, until];
  if (filters?.userId) {
    userConditions.push("user_id = ?");
    userParams.push(filters.userId);
  }
  const userWhere = `WHERE ${userConditions.join(" AND ")}`;

  const totalUsersRows = await db.$queryRawUnsafe<Array<{ total: bigint }>>(
    `SELECT COUNT(DISTINCT user_id) as total FROM sessions ${userWhere}`,
    ...userParams
  );
  const totalActiveUsers = Number(totalUsersRows[0].total);

  // 도구별 통계
  const eventConditions: string[] = [
    "e.tool_name IS NOT NULL",
    "e.event_type = 'PostToolUse'",
    "e.timestamp >= ?",
    "e.timestamp <= ?",
  ];
  const eventParams: unknown[] = [since, until];
  if (filters?.userId) {
    eventConditions.push("e.user_id = ?");
    eventParams.push(filters.userId);
  }
  const eventWhere = `WHERE ${eventConditions.join(" AND ")}`;

  const rows = await db.$queryRawUnsafe<Array<{
    tool_name: string;
    unique_users: bigint;
    total_uses: bigint;
  }>>(
    `SELECT
      e.tool_name,
      COUNT(DISTINCT e.user_id) as unique_users,
      COUNT(*) as total_uses
    FROM events e
    ${eventWhere}
    GROUP BY e.tool_name
    ORDER BY unique_users DESC, total_uses DESC`,
    ...eventParams
  );

  return rows.map((row) => ({
    tool_name: row.tool_name,
    unique_users: Number(row.unique_users),
    adoption_rate:
      totalActiveUsers > 0
        ? Math.round((Number(row.unique_users) / totalActiveUsers) * 10000) / 100
        : 0,
    total_uses: Number(row.total_uses),
    avg_uses_per_user:
      Number(row.unique_users) > 0
        ? Math.round((Number(row.total_uses) / Number(row.unique_users)) * 100) / 100
        : 0,
  }));
}

// ── 사용자별 참여 깊이(engagement) 메트릭 ──

export async function getEngagementMetrics(
  filters?: AdoptionFilterParams
): Promise<EngagementMetric[]> {
  if (isDemoMode()) return mockEngagementMetrics;
  const db = prisma!;
  const { since, until } = resolveDateRange(filters);

  const eventConditions: string[] = [
    "e.timestamp >= ?",
    "e.timestamp <= ?",
    "e.tool_name IS NOT NULL",
  ];
  const eventParams: unknown[] = [since, until];
  if (filters?.userId) {
    eventConditions.push("e.user_id = ?");
    eventParams.push(filters.userId);
  }
  const eventWhere = `WHERE ${eventConditions.join(" AND ")}`;

  const rows = await db.$queryRawUnsafe<Array<{
    user_id: string;
    unique_tools_used: bigint;
    total_events: bigint;
    total_sessions: bigint;
    total_turns: bigint;
  }>>(
    `SELECT
      e.user_id,
      COUNT(DISTINCT e.tool_name) as unique_tools_used,
      COUNT(*) as total_events,
      COUNT(DISTINCT e.session_id) as total_sessions,
      COALESCE(ts.total_turns, 0) as total_turns
    FROM events e
    LEFT JOIN (
      SELECT
        user_id,
        COALESCE(SUM(num_turns), 0) as total_turns
      FROM sessions
      WHERE started_at >= ? AND started_at <= ?
      GROUP BY user_id
    ) ts ON e.user_id = ts.user_id
    ${eventWhere}
    GROUP BY e.user_id
    ORDER BY unique_tools_used DESC, total_events DESC`,
    since, until, ...eventParams
  );

  return rows.map((row) => ({
    user_id: row.user_id,
    unique_tools_used: Number(row.unique_tools_used),
    total_events: Number(row.total_events),
    total_sessions: Number(row.total_sessions),
    avg_tool_diversity:
      Number(row.total_sessions) > 0
        ? Math.round((Number(row.unique_tools_used) / Number(row.total_sessions)) * 100) / 100
        : 0,
    total_turns: Number(row.total_turns),
  }));
}

// ── 리텐션(재사용) 메트릭 ──

export async function getRetentionMetrics(
  filters?: AdoptionFilterParams,
  maxWeeks: number = 8
): Promise<RetentionMetric[]> {
  if (isDemoMode()) return mockRetentionMetrics;
  const db = prisma!;
  const { since } = resolveDateRange(filters);

  const userCondition = filters?.userId ? "AND user_id = ?" : "";
  const cohortParams: unknown[] = [since];
  if (filters?.userId) {
    cohortParams.push(filters.userId);
  }

  const rows = await db.$queryRawUnsafe<Array<{
    cohort_start: string;
    weeks_after: number;
    retained_users: bigint;
    cohort_size: bigint;
  }>>(
    `WITH user_cohorts AS (
      SELECT
        user_id,
        strftime('%Y-W%W', MIN(started_at)) as cohort_start,
        MIN(started_at) as first_active
      FROM sessions
      WHERE started_at >= ?
        ${userCondition}
      GROUP BY user_id
    ),
    user_weeks AS (
      SELECT DISTINCT
        s.user_id,
        uc.cohort_start,
        uc.first_active,
        CAST(
          (julianday(s.started_at) - julianday(uc.first_active)) / 7
        AS INTEGER) as weeks_after
      FROM sessions s
      INNER JOIN user_cohorts uc ON s.user_id = uc.user_id
      WHERE s.started_at >= uc.first_active
    )
    SELECT
      uw.cohort_start,
      uw.weeks_after,
      COUNT(DISTINCT uw.user_id) as retained_users,
      (
        SELECT COUNT(*)
        FROM user_cohorts uc2
        WHERE uc2.cohort_start = uw.cohort_start
      ) as cohort_size
    FROM user_weeks uw
    WHERE uw.weeks_after >= 0 AND uw.weeks_after <= ?
    GROUP BY uw.cohort_start, uw.weeks_after
    ORDER BY uw.cohort_start ASC, uw.weeks_after ASC`,
    ...cohortParams, maxWeeks
  );

  return rows.map((row) => ({
    cohort_start: row.cohort_start,
    weeks_after: Number(row.weeks_after),
    retained_users: Number(row.retained_users),
    cohort_size: Number(row.cohort_size),
    retention_rate:
      Number(row.cohort_size) > 0
        ? Math.round((Number(row.retained_users) / Number(row.cohort_size)) * 10000) / 100
        : 0,
  }));
}

// ── 전체 채택률 요약 ──

export async function getAdoptionSummary(
  filters?: AdoptionFilterParams
): Promise<AdoptionSummary> {
  if (isDemoMode()) return mockAdoptionSummary;
  const db = prisma!;
  const now = new Date();

  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const userCondition = filters?.userId ? "AND user_id = ?" : "";
  const userParams = filters?.userId ? [filters.userId] : [];

  const activeRows = await db.$queryRawUnsafe<Array<{
    dau: bigint;
    wau: bigint;
    mau: bigint;
    total_users: bigint;
    total_sessions: bigint;
  }>>(
    `SELECT
      COUNT(DISTINCT CASE WHEN started_at >= ? THEN user_id END) as dau,
      COUNT(DISTINCT CASE WHEN started_at >= ? THEN user_id END) as wau,
      COUNT(DISTINCT CASE WHEN started_at >= ? THEN user_id END) as mau,
      COUNT(DISTINCT user_id) as total_users,
      COUNT(*) as total_sessions
    FROM sessions
    WHERE 1=1 ${userCondition}`,
    dayAgo, weekAgo, monthAgo, ...userParams
  );
  const activeRow = activeRows[0];

  const durationRows = await db.$queryRawUnsafe<Array<{ avg_duration_min: number }>>(
    `SELECT
      COALESCE(
        AVG((julianday(ended_at) - julianday(started_at)) * 24 * 60),
        0
      ) as avg_duration_min
    FROM sessions
    WHERE ended_at IS NOT NULL ${userCondition}`,
    ...userParams
  );

  const dailySessionRows = await db.$queryRawUnsafe<Array<{ avg_daily: number }>>(
    `SELECT
      COALESCE(AVG(daily_count), 0) as avg_daily
    FROM (
      SELECT user_id, date(started_at) as day, COUNT(*) as daily_count
      FROM sessions
      WHERE started_at >= ? ${userCondition}
      GROUP BY user_id, day
    )`,
    monthAgo, ...userParams
  );

  const topTools = (await getFeatureUsageMetrics({
    ...filters,
    since: monthAgo,
    until: now.toISOString(),
  })).slice(0, 10);

  const trend = await getActiveUsersMetrics({
    ...filters,
    period: "day",
    since: monthAgo,
    until: now.toISOString(),
  });

  return {
    active_users: {
      daily: Number(activeRow.dau),
      weekly: Number(activeRow.wau),
      monthly: Number(activeRow.mau),
    },
    total_users: Number(activeRow.total_users),
    total_sessions: Number(activeRow.total_sessions),
    avg_session_duration_min:
      Math.round(durationRows[0].avg_duration_min * 100) / 100,
    avg_daily_sessions_per_user:
      Math.round(dailySessionRows[0].avg_daily * 100) / 100,
    top_tools: topTools,
    trend,
  };
}

// ── 스냅샷 (집계 캐시) ──

export async function saveAdoptionSnapshot(
  snapshot: Omit<AdoptionSnapshot, "id" | "created_at">
): Promise<void> {
  if (isDemoMode()) return;
  const db = prisma!;
  await db.$queryRawUnsafe(
    `INSERT INTO adoption_snapshots (
      snapshot_date, period, active_users, total_sessions, total_users,
      avg_session_duration_min, avg_sessions_per_user, avg_turns_per_session,
      top_tools_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(snapshot_date, period) DO UPDATE SET
      active_users = excluded.active_users,
      total_sessions = excluded.total_sessions,
      total_users = excluded.total_users,
      avg_session_duration_min = excluded.avg_session_duration_min,
      avg_sessions_per_user = excluded.avg_sessions_per_user,
      avg_turns_per_session = excluded.avg_turns_per_session,
      top_tools_json = excluded.top_tools_json,
      created_at = datetime('now')`,
    snapshot.snapshot_date,
    snapshot.period,
    snapshot.active_users,
    snapshot.total_sessions,
    snapshot.total_users,
    snapshot.avg_session_duration_min,
    snapshot.avg_sessions_per_user,
    snapshot.avg_turns_per_session,
    snapshot.top_tools_json,
  );
}

export async function getAdoptionSnapshots(
  period: AdoptionPeriod = "day",
  limit: number = 30
): Promise<AdoptionSnapshot[]> {
  if (isDemoMode()) return mockAdoptionSnapshots.filter((s) => s.period === period).slice(0, limit);
  const rows = await prisma!.adoptionSnapshot.findMany({
    where: { period },
    orderBy: { snapshot_date: "desc" },
    take: limit,
  });
  return rows as AdoptionSnapshot[];
}

export async function createDailySnapshot(): Promise<AdoptionSnapshot> {
  if (isDemoMode()) return mockAdoptionSnapshots[0];
  const db = prisma!;
  const today = new Date().toISOString().split("T")[0];
  const dayStart = `${today}T00:00:00.000Z`;
  const dayEnd = `${today}T23:59:59.999Z`;

  const statsRows = await db.$queryRawUnsafe<Array<{
    active_users: bigint;
    total_sessions: bigint;
    total_users: bigint;
  }>>(
    `SELECT
      COUNT(DISTINCT user_id) as active_users,
      COUNT(*) as total_sessions,
      (SELECT COUNT(DISTINCT user_id) FROM sessions) as total_users
    FROM sessions
    WHERE started_at >= ? AND started_at <= ?`,
    dayStart, dayEnd
  );
  const statsRow = statsRows[0];

  const durationRows = await db.$queryRawUnsafe<Array<{ avg_min: number }>>(
    `SELECT COALESCE(
      AVG((julianday(ended_at) - julianday(started_at)) * 24 * 60),
      0
    ) as avg_min
    FROM sessions
    WHERE started_at >= ? AND started_at <= ? AND ended_at IS NOT NULL`,
    dayStart, dayEnd
  );

  const activeUsers = Number(statsRow.active_users);
  const totalSessions = Number(statsRow.total_sessions);
  const avgSessionsPerUser =
    activeUsers > 0
      ? Math.round((totalSessions / activeUsers) * 100) / 100
      : 0;

  const turnsRows = await db.$queryRawUnsafe<Array<{ avg_turns: number }>>(
    `SELECT COALESCE(AVG(num_turns), 0) as avg_turns
    FROM sessions
    WHERE started_at >= ? AND started_at <= ? AND num_turns IS NOT NULL`,
    dayStart, dayEnd
  );

  const topTools = (await getFeatureUsageMetrics({
    since: dayStart,
    until: dayEnd,
  })).slice(0, 10);

  const snapshot: Omit<AdoptionSnapshot, "id" | "created_at"> = {
    snapshot_date: today,
    period: "day",
    active_users: activeUsers,
    total_sessions: totalSessions,
    total_users: Number(statsRow.total_users),
    avg_session_duration_min:
      Math.round(durationRows[0].avg_min * 100) / 100,
    avg_sessions_per_user: avgSessionsPerUser,
    avg_turns_per_session:
      Math.round(turnsRows[0].avg_turns * 100) / 100,
    top_tools_json: JSON.stringify(topTools),
  };

  await saveAdoptionSnapshot(snapshot);

  return { ...snapshot } as AdoptionSnapshot;
}
