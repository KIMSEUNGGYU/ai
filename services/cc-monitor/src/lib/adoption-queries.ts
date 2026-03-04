/**
 * 채택률(Adoption Rate) 메트릭 수집·집계 쿼리
 *
 * 기존 sessions/events 테이블 데이터를 활용하여
 * DAU/WAU/MAU, 세션 빈도, 기능 채택률, 참여 깊이, 리텐션 등을 계산한다.
 */
import { getDb, isDemoMode } from "./db";
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

/** AdoptionFilterParams → WHERE 절 생성 (sessions 테이블 기준) */
function buildAdoptionFilterClause(
  filters?: AdoptionFilterParams,
  tableAlias: string = "s"
): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push(`${tableAlias}.user_id = ?`);
    params.push(filters.userId);
  }
  if (filters?.since) {
    conditions.push(`${tableAlias}.started_at >= ?`);
    params.push(filters.since);
  }
  if (filters?.until) {
    conditions.push(`${tableAlias}.started_at <= ?`);
    params.push(filters.until);
  }

  return {
    clause: conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "",
    params,
  };
}

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
      return 30; // 최근 30일
    case "week":
      return 90; // 최근 ~13주
    case "month":
      return 365; // 최근 12개월
  }
}

/** 날짜 범위 결정: filters에 since/until이 없으면 period 기반 기본값 */
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

/**
 * 기간별 활성 사용자 수 트렌드를 반환한다.
 * 세션 시작 시각 기준으로 기간을 분할하고, 각 기간의 고유 사용자 수와 세션 수를 집계한다.
 */
export function getActiveUsersMetrics(
  filters?: AdoptionFilterParams
): ActiveUsersMetric[] {
  if (isDemoMode()) return mockActiveUsersMetrics;
  const db = getDb()!;
  const period = filters?.period ?? "day";
  const dateFormat = periodToDateFormat(period);
  const { since, until } = resolveDateRange(filters);
  const { clause, params } = buildAdoptionFilterClause(filters);

  const rows = db
    .prepare(
      `
      SELECT
        strftime('${dateFormat}', s.started_at) as period_start,
        COUNT(DISTINCT s.user_id) as active_users,
        COUNT(*) as total_sessions
      FROM sessions s
      WHERE s.started_at >= ? AND s.started_at <= ?
        ${clause}
      GROUP BY period_start
      ORDER BY period_start ASC
    `
    )
    .all(since, until, ...params) as Array<{
    period_start: string;
    active_users: number;
    total_sessions: number;
  }>;

  return rows.map((row) => ({
    period,
    period_start: row.period_start,
    active_users: row.active_users,
    total_sessions: row.total_sessions,
    avg_sessions_per_user:
      row.active_users > 0
        ? Math.round((row.total_sessions / row.active_users) * 100) / 100
        : 0,
  }));
}

// ── 사용자별 세션 빈도 메트릭 ──

/**
 * 사용자별 세션 사용 빈도 및 세션 통계를 반환한다.
 * 활동 일수, 평균 세션 시간, 턴 수 등 사용자의 활용도를 종합적으로 보여준다.
 */
export function getSessionFrequencyMetrics(
  filters?: AdoptionFilterParams
): SessionFrequencyMetric[] {
  if (isDemoMode()) return mockSessionFrequencyMetrics;
  const db = getDb()!;
  const { since, until } = resolveDateRange(filters);
  const { clause, params } = buildAdoptionFilterClause(filters);

  const rows = db
    .prepare(
      `
      SELECT
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
      WHERE s.started_at >= ? AND s.started_at <= ?
        ${clause}
      GROUP BY s.user_id
      ORDER BY session_count DESC
    `
    )
    .all(since, until, ...params) as Array<{
    user_id: string;
    session_count: number;
    avg_duration_min: number;
    avg_turns_per_session: number;
    avg_events_per_session: number;
    last_active: string;
    active_days: number;
  }>;

  return rows.map((row) => ({
    user_id: row.user_id,
    session_count: row.session_count,
    avg_duration_min: Math.round(row.avg_duration_min * 100) / 100,
    avg_turns_per_session: Math.round(row.avg_turns_per_session * 100) / 100,
    avg_events_per_session: Math.round(row.avg_events_per_session * 100) / 100,
    last_active: row.last_active,
    active_days: row.active_days,
  }));
}

// ── 기능(도구)별 채택률 메트릭 ──

/**
 * 도구별 채택률을 계산한다.
 * 채택률 = (해당 도구를 사용한 고유 사용자 수 / 전체 활성 사용자 수) × 100
 */
export function getFeatureUsageMetrics(
  filters?: AdoptionFilterParams
): FeatureUsageMetric[] {
  if (isDemoMode()) return mockFeatureUsageMetrics;
  const db = getDb()!;
  const { since, until } = resolveDateRange(filters);

  // 전체 활성 사용자 수 (기간 내 세션이 있는 고유 사용자)
  const userConditions: string[] = [];
  const userParams: unknown[] = [since, until];
  if (filters?.userId) {
    userConditions.push("AND user_id = ?");
    userParams.push(filters.userId);
  }
  const userClause = userConditions.join(" ");

  const totalUsersRow = db
    .prepare(
      `
      SELECT COUNT(DISTINCT user_id) as total
      FROM sessions
      WHERE started_at >= ? AND started_at <= ? ${userClause}
    `
    )
    .get(...userParams) as { total: number };

  const totalActiveUsers = totalUsersRow.total;

  // 도구별 통계 (PostToolUse 이벤트 기준으로 실제 실행된 도구만 집계)
  const eventConditions: string[] = [];
  const eventParams: unknown[] = [since, until];
  if (filters?.userId) {
    eventConditions.push("AND e.user_id = ?");
    eventParams.push(filters.userId);
  }
  const eventClause = eventConditions.join(" ");

  const rows = db
    .prepare(
      `
      SELECT
        e.tool_name,
        COUNT(DISTINCT e.user_id) as unique_users,
        COUNT(*) as total_uses
      FROM events e
      WHERE e.tool_name IS NOT NULL
        AND e.event_type = 'PostToolUse'
        AND e.timestamp >= ? AND e.timestamp <= ?
        ${eventClause}
      GROUP BY e.tool_name
      ORDER BY unique_users DESC, total_uses DESC
    `
    )
    .all(...eventParams) as Array<{
    tool_name: string;
    unique_users: number;
    total_uses: number;
  }>;

  return rows.map((row) => ({
    tool_name: row.tool_name,
    unique_users: row.unique_users,
    adoption_rate:
      totalActiveUsers > 0
        ? Math.round((row.unique_users / totalActiveUsers) * 10000) / 100
        : 0,
    total_uses: row.total_uses,
    avg_uses_per_user:
      row.unique_users > 0
        ? Math.round((row.total_uses / row.unique_users) * 100) / 100
        : 0,
  }));
}

// ── 사용자별 참여 깊이(engagement) 메트릭 ──

/**
 * 사용자별 도구 다양성 및 참여 깊이를 반환한다.
 * 사용한 고유 도구 종류, 세션당 평균 도구 다양성 등을 측정한다.
 */
export function getEngagementMetrics(
  filters?: AdoptionFilterParams
): EngagementMetric[] {
  if (isDemoMode()) return mockEngagementMetrics;
  const db = getDb()!;
  const { since, until } = resolveDateRange(filters);

  const eventConditions: string[] = [];
  const eventParams: unknown[] = [since, until];
  if (filters?.userId) {
    eventConditions.push("AND e.user_id = ?");
    eventParams.push(filters.userId);
  }
  const eventClause = eventConditions.join(" ");

  const rows = db
    .prepare(
      `
      SELECT
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
      WHERE e.timestamp >= ? AND e.timestamp <= ?
        AND e.tool_name IS NOT NULL
        ${eventClause}
      GROUP BY e.user_id
      ORDER BY unique_tools_used DESC, total_events DESC
    `
    )
    .all(since, until, since, until, ...eventParams) as Array<{
    user_id: string;
    unique_tools_used: number;
    total_events: number;
    total_sessions: number;
    total_turns: number;
  }>;

  return rows.map((row) => ({
    user_id: row.user_id,
    unique_tools_used: row.unique_tools_used,
    total_events: row.total_events,
    total_sessions: row.total_sessions,
    avg_tool_diversity:
      row.total_sessions > 0
        ? Math.round((row.unique_tools_used / row.total_sessions) * 100) / 100
        : 0,
    total_turns: row.total_turns,
  }));
}

// ── 리텐션(재사용) 메트릭 ──

/**
 * 주간 코호트 기반 리텐션 메트릭을 계산한다.
 * 사용자가 처음 활동한 주를 코호트로 잡고, 이후 주별 재방문율을 계산한다.
 */
export function getRetentionMetrics(
  filters?: AdoptionFilterParams,
  maxWeeks: number = 8
): RetentionMetric[] {
  if (isDemoMode()) return mockRetentionMetrics;
  const db = getDb()!;
  const { since } = resolveDateRange(filters);

  const userConditions: string[] = [];
  const cohortParams: unknown[] = [since];
  if (filters?.userId) {
    userConditions.push("AND user_id = ?");
    cohortParams.push(filters.userId);
  }
  const userClause = userConditions.join(" ");

  // 각 사용자의 첫 활동 주(코호트) 결정
  // 그 후 각 주에 활동이 있는지 확인
  const rows = db
    .prepare(
      `
      WITH user_cohorts AS (
        SELECT
          user_id,
          strftime('%Y-W%W', MIN(started_at)) as cohort_start,
          MIN(started_at) as first_active
        FROM sessions
        WHERE started_at >= ?
          ${userClause}
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
      ORDER BY uw.cohort_start ASC, uw.weeks_after ASC
    `
    )
    .all(...cohortParams, maxWeeks) as Array<{
    cohort_start: string;
    weeks_after: number;
    retained_users: number;
    cohort_size: number;
  }>;

  return rows.map((row) => ({
    cohort_start: row.cohort_start,
    weeks_after: row.weeks_after,
    retained_users: row.retained_users,
    cohort_size: row.cohort_size,
    retention_rate:
      row.cohort_size > 0
        ? Math.round((row.retained_users / row.cohort_size) * 10000) / 100
        : 0,
  }));
}

// ── 전체 채택률 요약 ──

/**
 * 대시보드용 채택률 종합 요약을 반환한다.
 * DAU/WAU/MAU, 전체 통계, 도구 채택률 Top N, 일별 트렌드를 포함한다.
 */
export function getAdoptionSummary(
  filters?: AdoptionFilterParams
): AdoptionSummary {
  if (isDemoMode()) return mockAdoptionSummary;
  const db = getDb()!;
  const now = new Date();

  // DAU: 지난 24시간, WAU: 지난 7일, MAU: 지난 30일
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const monthAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const userConditions: string[] = [];
  const userParams: unknown[] = [];
  if (filters?.userId) {
    userConditions.push("AND user_id = ?");
    userParams.push(filters.userId);
  }
  const userClause = userConditions.join(" ");

  // DAU/WAU/MAU 한번에 조회
  const activeRow = db
    .prepare(
      `
      SELECT
        COUNT(DISTINCT CASE WHEN started_at >= ? THEN user_id END) as dau,
        COUNT(DISTINCT CASE WHEN started_at >= ? THEN user_id END) as wau,
        COUNT(DISTINCT CASE WHEN started_at >= ? THEN user_id END) as mau,
        COUNT(DISTINCT user_id) as total_users,
        COUNT(*) as total_sessions
      FROM sessions
      WHERE 1=1 ${userClause}
    `
    )
    .get(dayAgo, weekAgo, monthAgo, ...userParams) as {
    dau: number;
    wau: number;
    mau: number;
    total_users: number;
    total_sessions: number;
  };

  // 평균 세션 시간 (ended_at이 있는 세션만)
  const durationRow = db
    .prepare(
      `
      SELECT
        COALESCE(
          AVG((julianday(ended_at) - julianday(started_at)) * 24 * 60),
          0
        ) as avg_duration_min
      FROM sessions
      WHERE ended_at IS NOT NULL ${userClause}
    `
    )
    .get(...userParams) as { avg_duration_min: number };

  // 사용자당 평균 일일 세션 수 (최근 30일)
  const dailySessionRow = db
    .prepare(
      `
      SELECT
        COALESCE(
          AVG(daily_count),
          0
        ) as avg_daily
      FROM (
        SELECT
          user_id,
          date(started_at) as day,
          COUNT(*) as daily_count
        FROM sessions
        WHERE started_at >= ? ${userClause}
        GROUP BY user_id, day
      )
    `
    )
    .get(monthAgo, ...userParams) as { avg_daily: number };

  // 도구 채택률 Top 10
  const topTools = getFeatureUsageMetrics({
    ...filters,
    since: monthAgo,
    until: now.toISOString(),
  }).slice(0, 10);

  // 일별 트렌드 (최근 30일)
  const trend = getActiveUsersMetrics({
    ...filters,
    period: "day",
    since: monthAgo,
    until: now.toISOString(),
  });

  return {
    active_users: {
      daily: activeRow.dau,
      weekly: activeRow.wau,
      monthly: activeRow.mau,
    },
    total_users: activeRow.total_users,
    total_sessions: activeRow.total_sessions,
    avg_session_duration_min:
      Math.round(durationRow.avg_duration_min * 100) / 100,
    avg_daily_sessions_per_user:
      Math.round(dailySessionRow.avg_daily * 100) / 100,
    top_tools: topTools,
    trend,
  };
}

// ── 스냅샷 (집계 캐시) ──

/**
 * 채택률 스냅샷을 DB에 저장한다.
 * UNIQUE(snapshot_date, period) 제약이 있으므로 중복 시 갱신한다.
 */
export function saveAdoptionSnapshot(
  snapshot: Omit<AdoptionSnapshot, "id" | "created_at">
): void {
  if (isDemoMode()) return;
  const db = getDb()!;
  db.prepare(
    `
    INSERT INTO adoption_snapshots (
      snapshot_date, period, active_users, total_sessions, total_users,
      avg_session_duration_min, avg_sessions_per_user, avg_turns_per_session,
      top_tools_json
    ) VALUES (
      @snapshot_date, @period, @active_users, @total_sessions, @total_users,
      @avg_session_duration_min, @avg_sessions_per_user, @avg_turns_per_session,
      @top_tools_json
    )
    ON CONFLICT(snapshot_date, period) DO UPDATE SET
      active_users = excluded.active_users,
      total_sessions = excluded.total_sessions,
      total_users = excluded.total_users,
      avg_session_duration_min = excluded.avg_session_duration_min,
      avg_sessions_per_user = excluded.avg_sessions_per_user,
      avg_turns_per_session = excluded.avg_turns_per_session,
      top_tools_json = excluded.top_tools_json,
      created_at = datetime('now')
  `
  ).run(snapshot);
}

/**
 * 저장된 채택률 스냅샷을 조회한다.
 */
export function getAdoptionSnapshots(
  period: AdoptionPeriod = "day",
  limit: number = 30
): AdoptionSnapshot[] {
  if (isDemoMode()) return mockAdoptionSnapshots.filter((s) => s.period === period).slice(0, limit);
  const db = getDb()!;
  return db
    .prepare(
      `
      SELECT *
      FROM adoption_snapshots
      WHERE period = ?
      ORDER BY snapshot_date DESC
      LIMIT ?
    `
    )
    .all(period, limit) as AdoptionSnapshot[];
}

/**
 * 오늘 날짜의 일일 스냅샷을 생성하여 저장한다.
 * 기존 데이터를 기반으로 집계한 후 adoption_snapshots 테이블에 캐싱한다.
 */
export function createDailySnapshot(): AdoptionSnapshot {
  if (isDemoMode()) return mockAdoptionSnapshots[0];
  const db = getDb()!;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const dayStart = `${today}T00:00:00.000Z`;
  const dayEnd = `${today}T23:59:59.999Z`;

  // 오늘의 활성 사용자 수 & 세션 수
  const statsRow = db
    .prepare(
      `
      SELECT
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_sessions,
        (SELECT COUNT(DISTINCT user_id) FROM sessions) as total_users
      FROM sessions
      WHERE started_at >= ? AND started_at <= ?
    `
    )
    .get(dayStart, dayEnd) as {
    active_users: number;
    total_sessions: number;
    total_users: number;
  };

  // 평균 세션 시간
  const durationRow = db
    .prepare(
      `
      SELECT COALESCE(
        AVG((julianday(ended_at) - julianday(started_at)) * 24 * 60),
        0
      ) as avg_min
      FROM sessions
      WHERE started_at >= ? AND started_at <= ? AND ended_at IS NOT NULL
    `
    )
    .get(dayStart, dayEnd) as { avg_min: number };

  // 사용자당 평균 세션 수
  const avgSessionsPerUser =
    statsRow.active_users > 0
      ? Math.round(
          (statsRow.total_sessions / statsRow.active_users) * 100
        ) / 100
      : 0;

  // 평균 턴 수
  const turnsRow = db
    .prepare(
      `
      SELECT COALESCE(AVG(num_turns), 0) as avg_turns
      FROM sessions
      WHERE started_at >= ? AND started_at <= ? AND num_turns IS NOT NULL
    `
    )
    .get(dayStart, dayEnd) as { avg_turns: number };

  // 도구 채택률 Top 10
  const topTools = getFeatureUsageMetrics({
    since: dayStart,
    until: dayEnd,
  }).slice(0, 10);

  const snapshot: Omit<AdoptionSnapshot, "id" | "created_at"> = {
    snapshot_date: today,
    period: "day",
    active_users: statsRow.active_users,
    total_sessions: statsRow.total_sessions,
    total_users: statsRow.total_users,
    avg_session_duration_min:
      Math.round(durationRow.avg_min * 100) / 100,
    avg_sessions_per_user: avgSessionsPerUser,
    avg_turns_per_session:
      Math.round(turnsRow.avg_turns * 100) / 100,
    top_tools_json: JSON.stringify(topTools),
  };

  saveAdoptionSnapshot(snapshot);

  return { ...snapshot } as AdoptionSnapshot;
}
