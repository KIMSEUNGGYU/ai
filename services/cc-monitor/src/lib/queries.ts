import { prisma, isDemoMode } from "./db";
import {
  mockSessions,
  mockEvents,
  mockToolUsageStats,
  mockToolDurationStats,
  mockHourlyActivity,
  mockUserSummaries,
  mockTokenUsage,
  mockAdoptionSummary,
  mockActiveUsersMetrics,
  mockFeatureUsageMetrics,
  mockSessionFrequencyMetrics,
  mockEngagementMetrics,
  mockRetentionMetrics,
  mockAdoptionSnapshots,
  mockPromptLogListResponse,
  mockPromptLogUsers,
  mockPromptLogProjects,
} from "./mock-data";
import type {
  StoredEvent,
  Session,
  ToolUsageStat,
  HourlyActivity,
  UserSummary,
  ToolDurationStat,
  TokenUsageSummary,
  FilterParams,
  PromptLog,
  PromptLogDetail,
  PromptLogFilters,
  PromptLogListResponse,
  AdoptionSummary,
  ActiveUsersMetric,
  SessionFrequencyMetric,
  FeatureUsageMetric,
  EngagementMetric,
  RetentionMetric,
  AdoptionFilterParams,
  AdoptionPeriod,
  AdoptionSnapshot,
  PromptLogInput,
  PromptLogInsertResult,
} from "./types";

// ── 이벤트 ──

export async function insertEvent(event: Omit<StoredEvent, "id">): Promise<void> {
  if (isDemoMode()) return;
  await prisma!.event.create({ data: event });
}

export async function calcToolDuration(toolUseId: string, postTimestamp: string): Promise<number | null> {
  if (isDemoMode()) return null;
  const db = prisma!;

  const preEvent = await db.event.findFirst({
    where: { tool_use_id: toolUseId, event_type: "PreToolUse" },
    select: { timestamp: true },
  });

  if (!preEvent) return null;

  const preTime = new Date(preEvent.timestamp).getTime();
  const postTime = new Date(postTimestamp).getTime();
  const duration = postTime - preTime;

  if (duration >= 0) {
    await db.event.updateMany({
      where: { tool_use_id: toolUseId, event_type: "PostToolUse" },
      data: { tool_duration_ms: duration },
    });
  }

  return duration >= 0 ? duration : null;
}

export async function getRecentEvents(limit: number = 50, filters?: FilterParams): Promise<StoredEvent[]> {
  if (isDemoMode()) return mockEvents.slice(0, limit);
  return await prisma!.event.findMany({
    where: {
      ...(filters?.userId && { user_id: filters.userId }),
      ...(filters?.toolName && { tool_name: filters.toolName }),
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  }) as StoredEvent[];
}

export async function getEventsSince(since: string, limit: number = 100, filters?: FilterParams): Promise<StoredEvent[]> {
  if (isDemoMode()) return mockEvents.slice(0, limit);
  return await prisma!.event.findMany({
    where: {
      timestamp: { gt: since },
      ...(filters?.userId && { user_id: filters.userId }),
      ...(filters?.toolName && { tool_name: filters.toolName }),
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  }) as StoredEvent[];
}

// ── 세션 ──

export async function upsertSession(session: {
  session_id: string;
  user_id?: string;
  project_path?: string;
  model?: string | null;
  permission_mode?: string | null;
  transcript_path?: string | null;
  started_at?: string;
  ended_at?: string;
  status?: "active" | "ended";
}): Promise<void> {
  if (isDemoMode()) return;
  const db = prisma!;

  const existing = await db.session.findUnique({
    where: { session_id: session.session_id },
  });

  if (existing) {
    const data: Record<string, unknown> = {};
    if (session.ended_at) data.ended_at = session.ended_at;
    if (session.status) data.status = session.status;
    if (session.model) data.model = session.model;
    if (session.permission_mode) data.permission_mode = session.permission_mode;
    if (session.transcript_path) data.transcript_path = session.transcript_path;

    if (Object.keys(data).length > 0) {
      await db.session.update({
        where: { session_id: session.session_id },
        data,
      });
    }
  } else {
    await db.session.create({
      data: {
        session_id: session.session_id,
        user_id: session.user_id ?? "unknown",
        project_path: session.project_path ?? "",
        model: session.model ?? null,
        permission_mode: session.permission_mode ?? null,
        started_at: session.started_at ?? new Date().toISOString(),
        status: session.status ?? "active",
      },
    });
  }
}

export async function getSessions(status: "active" | "ended" | "all" = "active", filters?: FilterParams): Promise<Session[]> {
  if (isDemoMode()) {
    return status === "all"
      ? mockSessions
      : mockSessions.filter((s) => s.status === status);
  }
  const db = prisma!;

  // 복잡한 서브쿼리 + 조건부 JOIN이므로 $queryRaw 사용
  const conditions: string[] = [];
  const params: unknown[] = [];

  const toolFilter = filters?.toolName ? "WHERE tool_name = ?" : "";
  const joinType = filters?.toolName ? "INNER JOIN" : "LEFT JOIN";

  if (filters?.toolName) {
    params.push(filters.toolName);
  }
  if (status !== "all") {
    conditions.push("s.status = ?");
    params.push(status);
  }
  if (filters?.userId) {
    conditions.push("s.user_id = ?");
    params.push(filters.userId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await db.$queryRawUnsafe<Session[]>(`
    SELECT
      s.*,
      COALESCE(e.event_count, 0) as event_count,
      COALESCE(e.tool_count, 0) as tool_count
    FROM sessions s
    ${joinType} (
      SELECT
        session_id,
        COUNT(*) as event_count,
        COUNT(CASE WHEN tool_name IS NOT NULL THEN 1 END) as tool_count
      FROM events
      ${toolFilter}
      GROUP BY session_id
    ) e ON s.session_id = e.session_id
    ${where}
    ORDER BY s.started_at DESC
  `, ...params);

  return rows;
}

// ── 분석 ──

export async function getToolUsageStats(hours: number = 24, filters?: FilterParams): Promise<ToolUsageStat[]> {
  if (isDemoMode()) return mockToolUsageStats;
  const db = prisma!;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const conditions: string[] = ["tool_name IS NOT NULL", "timestamp > ?"];
  const params: unknown[] = [since];

  if (filters?.userId) {
    conditions.push("user_id = ?");
    params.push(filters.userId);
  }
  if (filters?.toolName) {
    conditions.push("tool_name = ?");
    params.push(filters.toolName);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await db.$queryRawUnsafe<Array<{ tool_name: string; count: bigint }>>(`
    SELECT tool_name, COUNT(*) as count
    FROM events
    ${where}
    GROUP BY tool_name
    ORDER BY count DESC
    LIMIT 10
  `, ...params);

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

  return rows.map((r) => ({
    tool_name: r.tool_name,
    count: Number(r.count),
    percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
  }));
}

export async function getToolDurationStats(hours: number = 24, filters?: FilterParams): Promise<ToolDurationStat[]> {
  if (isDemoMode()) return mockToolDurationStats;
  const db = prisma!;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const conditions: string[] = [
    "tool_name IS NOT NULL",
    "tool_duration_ms IS NOT NULL",
    "event_type = 'PostToolUse'",
    "timestamp > ?",
  ];
  const params: unknown[] = [since];

  if (filters?.userId) {
    conditions.push("user_id = ?");
    params.push(filters.userId);
  }
  if (filters?.toolName) {
    conditions.push("tool_name = ?");
    params.push(filters.toolName);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await db.$queryRawUnsafe<ToolDurationStat[]>(`
    SELECT
      tool_name,
      CAST(AVG(tool_duration_ms) AS INTEGER) as avg_ms,
      MAX(tool_duration_ms) as max_ms,
      COUNT(*) as count
    FROM events
    ${where}
    GROUP BY tool_name
    ORDER BY avg_ms DESC
  `, ...params);

  return rows.map((r) => ({
    tool_name: r.tool_name,
    avg_ms: Number(r.avg_ms),
    max_ms: Number(r.max_ms),
    count: Number(r.count),
  }));
}

export async function getHourlyActivity(hours: number = 24, filters?: FilterParams): Promise<HourlyActivity[]> {
  if (isDemoMode()) return mockHourlyActivity;
  const db = prisma!;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const conditions: string[] = ["timestamp > ?"];
  const params: unknown[] = [since];

  if (filters?.userId) {
    conditions.push("user_id = ?");
    params.push(filters.userId);
  }
  if (filters?.toolName) {
    conditions.push("tool_name = ?");
    params.push(filters.toolName);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await db.$queryRawUnsafe<Array<{ hour: number; count: bigint }>>(`
    SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as count
    FROM events
    ${where}
    GROUP BY hour
    ORDER BY hour
  `, ...params);

  return rows.map((r) => ({ hour: Number(r.hour), count: Number(r.count) }));
}

export async function getUserSummaries(filters?: FilterParams): Promise<UserSummary[]> {
  if (isDemoMode()) return mockUserSummaries;
  const db = prisma!;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push("e.user_id = ?");
    params.push(filters.userId);
  }
  if (filters?.toolName) {
    conditions.push("e.tool_name = ?");
    params.push(filters.toolName);
  }

  const clause = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  const rows = await db.$queryRawUnsafe<UserSummary[]>(`
    SELECT
      e.user_id,
      COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.session_id END) as active_sessions,
      COUNT(*) as total_events,
      MAX(e.timestamp) as last_activity
    FROM events e
    LEFT JOIN sessions s ON e.session_id = s.session_id
    WHERE 1=1 ${clause}
    GROUP BY e.user_id
    ORDER BY last_activity DESC
  `, ...params);

  return rows.map((r) => ({
    user_id: r.user_id,
    active_sessions: Number(r.active_sessions),
    total_events: Number(r.total_events),
    last_activity: r.last_activity,
  }));
}

// ── 토큰 ──

export async function updateSessionTokens(
  sessionId: string,
  tokens: {
    total_input_tokens: number;
    total_output_tokens: number;
    total_cache_create_tokens: number;
    total_cache_read_tokens: number;
    num_turns: number;
  }
): Promise<void> {
  if (isDemoMode()) return;
  await prisma!.session.update({
    where: { session_id: sessionId },
    data: tokens,
  });
}

export async function getSessionTranscriptPath(sessionId: string): Promise<string | null> {
  if (isDemoMode()) return null;
  const row = await prisma!.session.findUnique({
    where: { session_id: sessionId },
    select: { transcript_path: true },
  });
  return row?.transcript_path ?? null;
}

export async function getTokenUsageSummary(filters?: FilterParams): Promise<TokenUsageSummary> {
  if (isDemoMode()) return mockTokenUsage;
  const db = prisma!;

  const conditions: string[] = ["total_input_tokens IS NOT NULL"];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push("user_id = ?");
    params.push(filters.userId);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await db.$queryRawUnsafe<Array<{
    input_tokens: bigint;
    output_tokens: bigint;
    cache_create_tokens: bigint;
    cache_read_tokens: bigint;
    turns: bigint;
    session_count: bigint;
  }>>(`
    SELECT
      COALESCE(SUM(total_input_tokens), 0) as input_tokens,
      COALESCE(SUM(total_output_tokens), 0) as output_tokens,
      COALESCE(SUM(total_cache_create_tokens), 0) as cache_create_tokens,
      COALESCE(SUM(total_cache_read_tokens), 0) as cache_read_tokens,
      COALESCE(SUM(num_turns), 0) as turns,
      COUNT(*) as session_count
    FROM sessions
    ${where}
  `, ...params);

  const row = rows[0];
  return {
    input_tokens: Number(row.input_tokens),
    output_tokens: Number(row.output_tokens),
    cache_create_tokens: Number(row.cache_create_tokens),
    cache_read_tokens: Number(row.cache_read_tokens),
    turns: Number(row.turns),
    session_count: Number(row.session_count),
  };
}

// ── 프롬프트 로그 ──

export async function insertPromptLog(input: PromptLogInput): Promise<PromptLogInsertResult> {
  if (isDemoMode()) return { id: 0, session_id: input.session_id, timestamp: new Date().toISOString() };
  const db = prisma!;
  const timestamp = input.timestamp ?? new Date().toISOString();
  const userId = input.user_id ?? "unknown";
  const projectPath = input.project_path ?? "";
  const promptText = input.prompt_text.substring(0, 500);
  const rawData = input.raw_data ? JSON.stringify(input.raw_data) : null;

  // 세션이 없으면 자동 생성
  const existingSession = await db.session.findUnique({
    where: { session_id: input.session_id },
    select: { session_id: true },
  });

  if (!existingSession) {
    await db.session.create({
      data: {
        session_id: input.session_id,
        user_id: userId,
        project_path: projectPath,
        model: input.model ?? null,
        permission_mode: input.permission_mode ?? null,
        started_at: timestamp,
        status: "active",
      },
    });
  }

  // 1) events에 dual-write
  const event = await db.event.create({
    data: {
      session_id: input.session_id,
      event_type: "UserPromptSubmit",
      user_id: userId,
      project_path: projectPath,
      tool_name: null,
      tool_input_summary: null,
      model: input.model ?? null,
      prompt_text: promptText,
      permission_mode: input.permission_mode ?? null,
      tool_use_id: null,
      tool_duration_ms: null,
      timestamp,
      raw_data: rawData,
    },
  });

  // 2) prompt_logs에 저장
  const promptLog = await db.promptLog.create({
    data: {
      session_id: input.session_id,
      event_id: event.id,
      user_id: userId,
      project_path: projectPath,
      prompt_text: promptText,
      response_text: null,
      model: input.model ?? null,
      permission_mode: input.permission_mode ?? null,
      timestamp,
      response_timestamp: null,
      duration_ms: null,
      input_tokens: null,
      output_tokens: null,
      cache_create_tokens: null,
      cache_read_tokens: null,
      turn_number: null,
      cost_usd: null,
    },
  });

  return {
    id: promptLog.id,
    session_id: input.session_id,
    timestamp,
  };
}

export async function insertPromptLogBatch(inputs: PromptLogInput[]): Promise<PromptLogInsertResult[]> {
  if (isDemoMode()) return inputs.map((i) => ({ id: 0, session_id: i.session_id, timestamp: new Date().toISOString() }));

  // Prisma doesn't have native transaction like better-sqlite3, but we can use $transaction
  const results: PromptLogInsertResult[] = [];
  await prisma!.$transaction(async () => {
    for (const input of inputs) {
      results.push(await insertPromptLog(input));
    }
  });
  return results;
}

export async function getPromptLogs(filters?: PromptLogFilters): Promise<PromptLogListResponse> {
  if (isDemoMode()) return mockPromptLogListResponse;
  const db = prisma!;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push("p.user_id = ?");
    params.push(filters.userId);
  }
  if (filters?.sessionId) {
    conditions.push("p.session_id = ?");
    params.push(filters.sessionId);
  }
  if (filters?.projectPath) {
    conditions.push("p.project_path LIKE ?");
    params.push(`%${filters.projectPath}%`);
  }
  if (filters?.search) {
    conditions.push("p.prompt_text LIKE ?");
    params.push(`%${filters.search}%`);
  }
  if (filters?.model) {
    conditions.push("(p.model = ? OR s.model = ?)");
    params.push(filters.model, filters.model);
  }
  if (filters?.dateFrom) {
    conditions.push("p.timestamp >= ?");
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    conditions.push("p.timestamp <= ?");
    params.push(filters.dateTo);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
  const offset = (page - 1) * limit;

  const countRows = await db.$queryRawUnsafe<Array<{ total: bigint }>>(`
    SELECT COUNT(*) as total
    FROM prompt_logs p
    LEFT JOIN sessions s ON p.session_id = s.session_id
    ${where}
  `, ...params);

  const total = Number(countRows[0].total);
  const totalPages = Math.ceil(total / limit);

  const logs = await db.$queryRawUnsafe<PromptLog[]>(`
    SELECT
      p.id,
      p.session_id,
      p.user_id,
      p.project_path,
      p.prompt_text,
      p.model,
      p.timestamp,
      p.input_tokens,
      p.output_tokens,
      p.cost_usd,
      p.duration_ms,
      p.turn_number,
      s.model as session_model,
      s.status as session_status
    FROM prompt_logs p
    LEFT JOIN sessions s ON p.session_id = s.session_id
    ${where}
    ORDER BY p.timestamp DESC
    LIMIT ? OFFSET ?
  `, ...params, limit, offset);

  return { logs, total, page, limit, totalPages };
}

export async function getPromptLogDetail(logId: number): Promise<PromptLogDetail | null> {
  if (isDemoMode()) return null;
  const db = prisma!;

  const rows = await db.$queryRawUnsafe<PromptLogDetail[]>(`
    SELECT
      p.id,
      p.session_id,
      p.event_id,
      p.user_id,
      p.project_path,
      p.prompt_text,
      p.model,
      p.permission_mode,
      p.timestamp,
      p.input_tokens,
      p.output_tokens,
      p.cache_create_tokens,
      p.cache_read_tokens,
      p.cost_usd,
      p.duration_ms,
      p.turn_number,
      p.response_text,
      p.response_timestamp,
      s.model as session_model,
      s.status as session_status,
      s.started_at as session_started_at,
      s.ended_at as session_ended_at,
      s.total_input_tokens,
      s.total_output_tokens
    FROM prompt_logs p
    LEFT JOIN sessions s ON p.session_id = s.session_id
    WHERE p.id = ?
  `, logId);

  if (rows.length === 0) return null;
  const log = rows[0];

  // response_text 없으면 events에서 Stop 이벤트 조회
  if (!log.response_text && log.event_id) {
    const responses = await db.$queryRawUnsafe<Array<{ raw_data: string | null; response_timestamp: string }>>(`
      SELECT
        e2.raw_data,
        e2.timestamp as response_timestamp
      FROM events e2
      WHERE e2.session_id = ?
        AND e2.event_type = 'Stop'
        AND e2.timestamp > ?
      ORDER BY e2.timestamp ASC
      LIMIT 1
    `, log.session_id, log.timestamp);

    if (responses.length > 0) {
      const response = responses[0];
      log.response_timestamp = response.response_timestamp;
      if (response.raw_data) {
        try {
          const parsed = JSON.parse(response.raw_data);
          log.response_text = parsed.last_assistant_message ?? null;
        } catch {
          log.response_text = null;
        }
      }
    }
  }

  return log;
}

export async function getPromptLogUsers(): Promise<string[]> {
  if (isDemoMode()) return mockPromptLogUsers;
  const db = prisma!;
  const rows = await db.$queryRawUnsafe<Array<{ user_id: string }>>(`
    SELECT DISTINCT user_id
    FROM events
    WHERE event_type = 'UserPromptSubmit' AND prompt_text IS NOT NULL
    ORDER BY user_id
  `);
  return rows.map((r) => r.user_id);
}

export async function getPromptLogProjects(): Promise<string[]> {
  if (isDemoMode()) return mockPromptLogProjects;
  const db = prisma!;
  const rows = await db.$queryRawUnsafe<Array<{ project_path: string }>>(`
    SELECT DISTINCT project_path
    FROM events
    WHERE event_type = 'UserPromptSubmit' AND prompt_text IS NOT NULL AND project_path IS NOT NULL
    ORDER BY project_path
  `);
  return rows.map((r) => r.project_path);
}

// ── 채택률 (Adoption) ──

export async function getAdoptionSummary(filters?: AdoptionFilterParams): Promise<AdoptionSummary> {
  if (isDemoMode()) return mockAdoptionSummary;
  const db = prisma!;
  const userCondition = filters?.userId ? "AND user_id = ?" : "";
  const userParams = filters?.userId ? [filters.userId] : [];

  const totalUsersRows = await db.$queryRawUnsafe<Array<{ cnt: bigint }>>(
    `SELECT COUNT(DISTINCT user_id) as cnt FROM sessions WHERE 1=1 ${userCondition}`,
    ...userParams
  );

  const dauRows = await db.$queryRawUnsafe<Array<{ cnt: bigint }>>(
    `SELECT COUNT(DISTINCT user_id) as cnt FROM sessions WHERE date(started_at) = date('now') ${userCondition}`,
    ...userParams
  );

  const wauRows = await db.$queryRawUnsafe<Array<{ cnt: bigint }>>(
    `SELECT COUNT(DISTINCT user_id) as cnt FROM sessions WHERE started_at >= datetime('now', '-7 days') ${userCondition}`,
    ...userParams
  );

  const mauRows = await db.$queryRawUnsafe<Array<{ cnt: bigint }>>(
    `SELECT COUNT(DISTINCT user_id) as cnt FROM sessions WHERE started_at >= datetime('now', '-30 days') ${userCondition}`,
    ...userParams
  );

  const sessionStatsRows = await db.$queryRawUnsafe<Array<{ total_sessions: bigint; avg_duration_min: number }>>(
    `SELECT
      COUNT(*) as total_sessions,
      COALESCE(AVG(
        CASE WHEN ended_at IS NOT NULL
          THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
          ELSE NULL
        END
      ), 0) as avg_duration_min
    FROM sessions
    WHERE 1=1 ${userCondition}`,
    ...userParams
  );

  const avgDailyRows = await db.$queryRawUnsafe<Array<{ avg_daily: number }>>(
    `SELECT COALESCE(AVG(daily_count), 0) as avg_daily FROM (
      SELECT user_id, date(started_at) as d, COUNT(*) as daily_count
      FROM sessions
      WHERE started_at >= datetime('now', '-30 days') ${userCondition}
      GROUP BY user_id, d
    )`,
    ...userParams
  );

  const topTools = await getFeatureUsageMetrics(filters);
  const trend = await getDailyActiveUsersTrend(30, filters);

  return {
    active_users: {
      daily: Number(dauRows[0].cnt),
      weekly: Number(wauRows[0].cnt),
      monthly: Number(mauRows[0].cnt),
    },
    total_users: Number(totalUsersRows[0].cnt),
    total_sessions: Number(sessionStatsRows[0].total_sessions),
    avg_session_duration_min: Math.round(sessionStatsRows[0].avg_duration_min * 10) / 10,
    avg_daily_sessions_per_user: Math.round(avgDailyRows[0].avg_daily * 10) / 10,
    top_tools: topTools,
    trend,
  };
}

export async function getDailyActiveUsersTrend(days: number = 30, filters?: AdoptionFilterParams): Promise<ActiveUsersMetric[]> {
  if (isDemoMode()) return mockActiveUsersMetrics;
  const db = prisma!;
  const userCondition = filters?.userId ? "AND s.user_id = ?" : "";
  const userParams = filters?.userId ? [filters.userId] : [];

  const rows = await db.$queryRawUnsafe<Array<{ period_start: string; active_users: bigint; total_sessions: bigint }>>(
    `SELECT
      date(s.started_at) as period_start,
      COUNT(DISTINCT s.user_id) as active_users,
      COUNT(*) as total_sessions
    FROM sessions s
    WHERE s.started_at >= datetime('now', '-' || ? || ' days') ${userCondition}
    GROUP BY date(s.started_at)
    ORDER BY period_start ASC`,
    days, ...userParams
  );

  return rows.map((r) => ({
    period: "day" as const,
    period_start: r.period_start,
    active_users: Number(r.active_users),
    total_sessions: Number(r.total_sessions),
    avg_sessions_per_user: Number(r.active_users) > 0
      ? Math.round((Number(r.total_sessions) / Number(r.active_users)) * 10) / 10
      : 0,
  }));
}

export async function getFeatureUsageMetrics(filters?: AdoptionFilterParams): Promise<FeatureUsageMetric[]> {
  if (isDemoMode()) return mockFeatureUsageMetrics;
  const db = prisma!;
  const conditions: string[] = ["e.tool_name IS NOT NULL"];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push("e.user_id = ?");
    params.push(filters.userId);
  }
  if (filters?.since) {
    conditions.push("e.timestamp >= ?");
    params.push(filters.since);
  } else {
    conditions.push("e.timestamp >= datetime('now', '-30 days')");
  }
  if (filters?.until) {
    conditions.push("e.timestamp <= ?");
    params.push(filters.until);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const totalUsersRows = await db.$queryRawUnsafe<Array<{ cnt: bigint }>>(
    `SELECT COUNT(DISTINCT e.user_id) as cnt FROM events e ${where}`,
    ...params
  );
  const totalActiveUsers = Number(totalUsersRows[0].cnt) || 1;

  const rows = await db.$queryRawUnsafe<Array<{ tool_name: string; unique_users: bigint; total_uses: bigint }>>(
    `SELECT
      e.tool_name,
      COUNT(DISTINCT e.user_id) as unique_users,
      COUNT(*) as total_uses
    FROM events e
    ${where}
    GROUP BY e.tool_name
    ORDER BY unique_users DESC, total_uses DESC
    LIMIT 15`,
    ...params
  );

  return rows.map((r) => ({
    tool_name: r.tool_name,
    unique_users: Number(r.unique_users),
    adoption_rate: Math.round((Number(r.unique_users) / totalActiveUsers) * 100),
    total_uses: Number(r.total_uses),
    avg_uses_per_user: Number(r.unique_users) > 0
      ? Math.round((Number(r.total_uses) / Number(r.unique_users)) * 10) / 10
      : 0,
  }));
}

export async function getSessionFrequencyMetrics(filters?: AdoptionFilterParams): Promise<SessionFrequencyMetric[]> {
  if (isDemoMode()) return mockSessionFrequencyMetrics;
  const db = prisma!;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push("s.user_id = ?");
    params.push(filters.userId);
  }
  if (filters?.since) {
    conditions.push("s.started_at >= ?");
    params.push(filters.since);
  } else {
    conditions.push("s.started_at >= datetime('now', '-30 days')");
  }
  if (filters?.until) {
    conditions.push("s.started_at <= ?");
    params.push(filters.until);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
      COALESCE(AVG(
        CASE WHEN s.ended_at IS NOT NULL
          THEN (julianday(s.ended_at) - julianday(s.started_at)) * 24 * 60
          ELSE NULL
        END
      ), 0) as avg_duration_min,
      COALESCE(AVG(s.num_turns), 0) as avg_turns_per_session,
      COALESCE(AVG(ec.event_count), 0) as avg_events_per_session,
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

  return rows.map((r) => ({
    user_id: r.user_id,
    session_count: Number(r.session_count),
    avg_duration_min: Math.round(r.avg_duration_min * 10) / 10,
    avg_turns_per_session: Math.round(r.avg_turns_per_session * 10) / 10,
    avg_events_per_session: Math.round(r.avg_events_per_session * 10) / 10,
    last_active: r.last_active,
    active_days: Number(r.active_days),
  }));
}

export async function getEngagementMetrics(filters?: AdoptionFilterParams): Promise<EngagementMetric[]> {
  if (isDemoMode()) return mockEngagementMetrics;
  const db = prisma!;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push("e.user_id = ?");
    params.push(filters.userId);
  }
  if (filters?.since) {
    conditions.push("e.timestamp >= ?");
    params.push(filters.since);
  } else {
    conditions.push("e.timestamp >= datetime('now', '-30 days')");
  }
  if (filters?.until) {
    conditions.push("e.timestamp <= ?");
    params.push(filters.until);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await db.$queryRawUnsafe<Array<{
    user_id: string;
    unique_tools_used: bigint;
    total_events: bigint;
    total_sessions: bigint;
    avg_tool_diversity: number | null;
    total_turns: bigint;
  }>>(
    `SELECT
      e.user_id,
      COUNT(DISTINCT e.tool_name) as unique_tools_used,
      COUNT(*) as total_events,
      COUNT(DISTINCT e.session_id) as total_sessions,
      CAST(COUNT(DISTINCT e.tool_name) AS REAL) /
        NULLIF(COUNT(DISTINCT e.session_id), 0) as avg_tool_diversity,
      COALESCE(st.total_turns, 0) as total_turns
    FROM events e
    LEFT JOIN (
      SELECT user_id, SUM(COALESCE(num_turns, 0)) as total_turns
      FROM sessions
      GROUP BY user_id
    ) st ON e.user_id = st.user_id
    ${where}
    GROUP BY e.user_id
    ORDER BY total_events DESC`,
    ...params
  );

  return rows.map((r) => ({
    user_id: r.user_id,
    unique_tools_used: Number(r.unique_tools_used),
    total_events: Number(r.total_events),
    total_sessions: Number(r.total_sessions),
    avg_tool_diversity: Math.round((r.avg_tool_diversity ?? 0) * 10) / 10,
    total_turns: Number(r.total_turns),
  }));
}

export async function getRetentionMetrics(weeks: number = 8, filters?: AdoptionFilterParams): Promise<RetentionMetric[]> {
  if (isDemoMode()) return mockRetentionMetrics;
  const db = prisma!;
  const userCondition = filters?.userId ? "AND user_id = ?" : "";
  const userParams = filters?.userId ? [filters.userId] : [];

  const rows = await db.$queryRawUnsafe<Array<{
    cohort_start: string;
    weeks_after: number;
    retained_users: bigint;
    cohort_size: bigint;
  }>>(
    `WITH user_cohorts AS (
      SELECT
        user_id,
        strftime('%Y-W%W', MIN(started_at)) as cohort_week,
        MIN(date(started_at, 'weekday 1', '-6 days')) as cohort_start_date
      FROM sessions
      WHERE 1=1 ${userCondition}
      GROUP BY user_id
    ),
    user_weekly_activity AS (
      SELECT DISTINCT
        s.user_id,
        uc.cohort_week as cohort_start,
        uc.cohort_start_date,
        CAST((julianday(date(s.started_at, 'weekday 1', '-6 days')) - julianday(uc.cohort_start_date)) / 7 AS INTEGER) as weeks_after
      FROM sessions s
      JOIN user_cohorts uc ON s.user_id = uc.user_id
      WHERE 1=1 ${userCondition}
    )
    SELECT
      uwa.cohort_start,
      uwa.weeks_after,
      COUNT(DISTINCT uwa.user_id) as retained_users,
      cs.cohort_size
    FROM user_weekly_activity uwa
    JOIN (
      SELECT cohort_week, COUNT(*) as cohort_size
      FROM user_cohorts
      GROUP BY cohort_week
    ) cs ON uwa.cohort_start = cs.cohort_week
    WHERE uwa.weeks_after >= 0 AND uwa.weeks_after <= ?
    GROUP BY uwa.cohort_start, uwa.weeks_after
    ORDER BY uwa.cohort_start ASC, uwa.weeks_after ASC`,
    ...userParams, ...userParams, weeks
  );

  return rows.map((r) => ({
    cohort_start: r.cohort_start,
    weeks_after: Number(r.weeks_after),
    retained_users: Number(r.retained_users),
    cohort_size: Number(r.cohort_size),
    retention_rate: Number(r.cohort_size) > 0
      ? Math.round((Number(r.retained_users) / Number(r.cohort_size)) * 100)
      : 0,
  }));
}

// ── 채택률 스냅샷 ──

export async function saveAdoptionSnapshot(
  period: AdoptionPeriod = "day",
  date?: string
): Promise<void> {
  if (isDemoMode()) return;
  const db = prisma!;
  const snapshotDate = date ?? new Date().toISOString().split("T")[0];
  const summary = await getAdoptionSummary();

  const activeUsersValue =
    period === "day"
      ? summary.active_users.daily
      : period === "week"
        ? summary.active_users.weekly
        : summary.active_users.monthly;

  const avgTurnsRows = await db.$queryRawUnsafe<Array<{ avg_turns: number }>>(
    `SELECT COALESCE(AVG(num_turns), 0) as avg_turns FROM sessions WHERE num_turns IS NOT NULL`
  );

  await db.$queryRawUnsafe(
    `INSERT OR REPLACE INTO adoption_snapshots
      (snapshot_date, period, active_users, total_sessions, total_users,
       avg_session_duration_min, avg_sessions_per_user, avg_turns_per_session, top_tools_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    snapshotDate,
    period,
    activeUsersValue,
    summary.total_sessions,
    summary.total_users,
    summary.avg_session_duration_min,
    summary.avg_daily_sessions_per_user,
    Math.round(avgTurnsRows[0].avg_turns * 10) / 10,
    JSON.stringify(summary.top_tools),
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
