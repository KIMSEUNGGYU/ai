import { getDb, isDemoMode } from "./db";
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
  PromptLogRecord,
  PromptLogStats,
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

// ── 필터 헬퍼 ──

function buildFilterClause(
  filters?: FilterParams,
  prefix: string = ""
): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const col = prefix ? `${prefix}.` : "";

  if (filters?.userId) {
    conditions.push(`${col}user_id = ?`);
    params.push(filters.userId);
  }
  if (filters?.toolName) {
    conditions.push(`${col}tool_name = ?`);
    params.push(filters.toolName);
  }

  return {
    clause: conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "",
    params,
  };
}

// ── 이벤트 ──

export function insertEvent(event: Omit<StoredEvent, "id">): void {
  if (isDemoMode()) return;
  const db = getDb()!;
  db.prepare(`
    INSERT INTO events (session_id, event_type, user_id, project_path, tool_name, tool_input_summary, model, prompt_text, permission_mode, tool_use_id, tool_duration_ms, timestamp, raw_data)
    VALUES (@session_id, @event_type, @user_id, @project_path, @tool_name, @tool_input_summary, @model, @prompt_text, @permission_mode, @tool_use_id, @tool_duration_ms, @timestamp, @raw_data)
  `).run(event);
}

export function calcToolDuration(toolUseId: string, postTimestamp: string): number | null {
  if (isDemoMode()) return null;
  const db = getDb()!;
  const preEvent = db
    .prepare("SELECT timestamp FROM events WHERE tool_use_id = ? AND event_type = 'PreToolUse' LIMIT 1")
    .get(toolUseId) as { timestamp: string } | undefined;

  if (!preEvent) return null;

  const preTime = new Date(preEvent.timestamp).getTime();
  const postTime = new Date(postTimestamp).getTime();
  const duration = postTime - preTime;

  if (duration >= 0) {
    db.prepare("UPDATE events SET tool_duration_ms = ? WHERE tool_use_id = ? AND event_type = 'PostToolUse'")
      .run(duration, toolUseId);
  }

  return duration >= 0 ? duration : null;
}

export function getRecentEvents(limit: number = 50, filters?: FilterParams): StoredEvent[] {
  if (isDemoMode()) return mockEvents.slice(0, limit);
  const db = getDb()!;
  const { clause, params } = buildFilterClause(filters);
  return db
    .prepare(`SELECT * FROM events WHERE 1=1 ${clause} ORDER BY timestamp DESC LIMIT ?`)
    .all(...params, limit) as StoredEvent[];
}

export function getEventsSince(since: string, limit: number = 100, filters?: FilterParams): StoredEvent[] {
  if (isDemoMode()) return mockEvents.slice(0, limit);
  const db = getDb()!;
  const { clause, params } = buildFilterClause(filters);
  return db
    .prepare(`SELECT * FROM events WHERE timestamp > ? ${clause} ORDER BY timestamp DESC LIMIT ?`)
    .all(since, ...params, limit) as StoredEvent[];
}

// ── 세션 ──

export function upsertSession(session: {
  session_id: string;
  user_id?: string;
  project_path?: string;
  model?: string | null;
  permission_mode?: string | null;
  transcript_path?: string | null;
  started_at?: string;
  ended_at?: string;
  status?: "active" | "ended";
}): void {
  if (isDemoMode()) return;
  const db = getDb()!;
  const existing = db
    .prepare("SELECT * FROM sessions WHERE session_id = ?")
    .get(session.session_id) as Session | undefined;

  if (existing) {
    const updates: string[] = [];
    const values: Record<string, unknown> = { session_id: session.session_id };

    if (session.ended_at) {
      updates.push("ended_at = @ended_at");
      values.ended_at = session.ended_at;
    }
    if (session.status) {
      updates.push("status = @status");
      values.status = session.status;
    }
    if (session.model) {
      updates.push("model = @model");
      values.model = session.model;
    }
    if (session.permission_mode) {
      updates.push("permission_mode = @permission_mode");
      values.permission_mode = session.permission_mode;
    }
    if (session.transcript_path) {
      updates.push("transcript_path = @transcript_path");
      values.transcript_path = session.transcript_path;
    }

    if (updates.length > 0) {
      db.prepare(
        `UPDATE sessions SET ${updates.join(", ")} WHERE session_id = @session_id`
      ).run(values);
    }
  } else {
    db.prepare(`
      INSERT INTO sessions (session_id, user_id, project_path, model, permission_mode, started_at, status)
      VALUES (@session_id, @user_id, @project_path, @model, @permission_mode, @started_at, @status)
    `).run({
      session_id: session.session_id,
      user_id: session.user_id ?? "unknown",
      project_path: session.project_path ?? "",
      model: session.model ?? null,
      permission_mode: session.permission_mode ?? null,
      started_at: session.started_at ?? new Date().toISOString(),
      status: session.status ?? "active",
    });
  }
}

export function getSessions(status: "active" | "ended" | "all" = "active", filters?: FilterParams): Session[] {
  if (isDemoMode()) {
    return status === "all"
      ? mockSessions
      : mockSessions.filter((s) => s.status === status);
  }
  const db = getDb()!;
  const conditions: string[] = [];
  const params: unknown[] = [];

  // toolName 필터 시 해당 도구를 사용한 세션만 표시
  const toolFilter = filters?.toolName ? "WHERE tool_name = ?" : "";
  const joinType = filters?.toolName ? "INNER JOIN" : "LEFT JOIN";

  const baseQuery = `
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
  `;

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

  return db
    .prepare(`${baseQuery} ${where} ORDER BY s.started_at DESC`)
    .all(...params) as Session[];
}

// ── 분석 ──

export function getToolUsageStats(hours: number = 24, filters?: FilterParams): ToolUsageStat[] {
  if (isDemoMode()) return mockToolUsageStats;
  const db = getDb()!;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { clause, params } = buildFilterClause(filters);

  const rows = db
    .prepare(`
      SELECT tool_name, COUNT(*) as count
      FROM events
      WHERE tool_name IS NOT NULL AND timestamp > ? ${clause}
      GROUP BY tool_name
      ORDER BY count DESC
      LIMIT 10
    `)
    .all(since, ...params) as Array<{ tool_name: string; count: number }>;

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return rows.map((r) => ({
    tool_name: r.tool_name,
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }));
}

export function getToolDurationStats(hours: number = 24, filters?: FilterParams): ToolDurationStat[] {
  if (isDemoMode()) return mockToolDurationStats;
  const db = getDb()!;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { clause, params } = buildFilterClause(filters);

  return db
    .prepare(`
      SELECT
        tool_name,
        CAST(AVG(tool_duration_ms) AS INTEGER) as avg_ms,
        MAX(tool_duration_ms) as max_ms,
        COUNT(*) as count
      FROM events
      WHERE tool_name IS NOT NULL
        AND tool_duration_ms IS NOT NULL
        AND event_type = 'PostToolUse'
        AND timestamp > ? ${clause}
      GROUP BY tool_name
      ORDER BY avg_ms DESC
    `)
    .all(since, ...params) as ToolDurationStat[];
}

export function getHourlyActivity(hours: number = 24, filters?: FilterParams): HourlyActivity[] {
  if (isDemoMode()) return mockHourlyActivity;
  const db = getDb()!;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { clause, params } = buildFilterClause(filters);

  return db
    .prepare(`
      SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as count
      FROM events
      WHERE timestamp > ? ${clause}
      GROUP BY hour
      ORDER BY hour
    `)
    .all(since, ...params) as HourlyActivity[];
}

export function getUserSummaries(filters?: FilterParams): UserSummary[] {
  if (isDemoMode()) return mockUserSummaries;
  const db = getDb()!;
  const { clause, params } = buildFilterClause(filters, "e");

  return db
    .prepare(`
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
    `)
    .all(...params) as UserSummary[];
}

// ── 토큰 ──

export function updateSessionTokens(
  sessionId: string,
  tokens: {
    total_input_tokens: number;
    total_output_tokens: number;
    total_cache_create_tokens: number;
    total_cache_read_tokens: number;
    num_turns: number;
  }
): void {
  if (isDemoMode()) return;
  const db = getDb()!;
  db.prepare(`
    UPDATE sessions
    SET total_input_tokens = @total_input_tokens,
        total_output_tokens = @total_output_tokens,
        total_cache_create_tokens = @total_cache_create_tokens,
        total_cache_read_tokens = @total_cache_read_tokens,
        num_turns = @num_turns
    WHERE session_id = @session_id
  `).run({ session_id: sessionId, ...tokens });
}

export function getSessionTranscriptPath(sessionId: string): string | null {
  if (isDemoMode()) return null;
  const db = getDb()!;
  const row = db
    .prepare("SELECT transcript_path FROM sessions WHERE session_id = ?")
    .get(sessionId) as { transcript_path: string | null } | undefined;
  return row?.transcript_path ?? null;
}

export function getTokenUsageSummary(filters?: FilterParams): TokenUsageSummary {
  if (isDemoMode()) return mockTokenUsage;
  const db = getDb()!;
  const conditions: string[] = ["total_input_tokens IS NOT NULL"];
  const params: unknown[] = [];

  if (filters?.userId) {
    conditions.push("user_id = ?");
    params.push(filters.userId);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const row = db
    .prepare(`
      SELECT
        COALESCE(SUM(total_input_tokens), 0) as input_tokens,
        COALESCE(SUM(total_output_tokens), 0) as output_tokens,
        COALESCE(SUM(total_cache_create_tokens), 0) as cache_create_tokens,
        COALESCE(SUM(total_cache_read_tokens), 0) as cache_read_tokens,
        COALESCE(SUM(num_turns), 0) as turns,
        COUNT(*) as session_count
      FROM sessions
      ${where}
    `)
    .get(...params) as TokenUsageSummary;

  return row;
}

// ── 프롬프트 로그 ──

/**
 * 프롬프트 로그를 DB에 저장한다.
 *
 * prompt_logs 테이블에 저장하고, events 테이블에도 dual-write 하여
 * 기존 이벤트 피드/분석과의 호환성을 유지한다.
 * 해당 session_id 에 대한 세션이 없으면 자동으로 생성한다.
 *
 * @returns 삽입된 레코드의 id, session_id, timestamp
 */
export function insertPromptLog(input: PromptLogInput): PromptLogInsertResult {
  if (isDemoMode()) return { id: 0, session_id: input.session_id, timestamp: new Date().toISOString() };
  const db = getDb()!;
  const timestamp = input.timestamp ?? new Date().toISOString();
  const userId = input.user_id ?? "unknown";
  const projectPath = input.project_path ?? "";
  const promptText = input.prompt_text.substring(0, 500); // 기존 이벤트 프로세서와 동일하게 500자 제한
  const rawData = input.raw_data ? JSON.stringify(input.raw_data) : null;

  // 세션이 존재하지 않으면 자동 생성 (외부 클라이언트에서 직접 프롬프트 로그를 보낼 때)
  const existingSession = db
    .prepare("SELECT session_id FROM sessions WHERE session_id = ?")
    .get(input.session_id) as { session_id: string } | undefined;

  if (!existingSession) {
    db.prepare(`
      INSERT INTO sessions (session_id, user_id, project_path, model, permission_mode, started_at, status)
      VALUES (@session_id, @user_id, @project_path, @model, @permission_mode, @started_at, @status)
    `).run({
      session_id: input.session_id,
      user_id: userId,
      project_path: projectPath,
      model: input.model ?? null,
      permission_mode: input.permission_mode ?? null,
      started_at: timestamp,
      status: "active",
    });
  }

  // 1) events 테이블에 dual-write (이벤트 피드 호환)
  const eventResult = db.prepare(`
    INSERT INTO events (session_id, event_type, user_id, project_path, tool_name, tool_input_summary, model, prompt_text, permission_mode, tool_use_id, tool_duration_ms, timestamp, raw_data)
    VALUES (@session_id, @event_type, @user_id, @project_path, @tool_name, @tool_input_summary, @model, @prompt_text, @permission_mode, @tool_use_id, @tool_duration_ms, @timestamp, @raw_data)
  `).run({
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
  });

  const eventId = Number(eventResult.lastInsertRowid);

  // 2) prompt_logs 전용 테이블에 저장 (풍부한 메타데이터 지원)
  const promptResult = db.prepare(`
    INSERT INTO prompt_logs (session_id, event_id, user_id, project_path, prompt_text, response_text, model, permission_mode, timestamp, response_timestamp, duration_ms, input_tokens, output_tokens, cache_create_tokens, cache_read_tokens, turn_number, cost_usd)
    VALUES (@session_id, @event_id, @user_id, @project_path, @prompt_text, @response_text, @model, @permission_mode, @timestamp, @response_timestamp, @duration_ms, @input_tokens, @output_tokens, @cache_create_tokens, @cache_read_tokens, @turn_number, @cost_usd)
  `).run({
    session_id: input.session_id,
    event_id: eventId,
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
  });

  return {
    id: Number(promptResult.lastInsertRowid),
    session_id: input.session_id,
    timestamp,
  };
}

/**
 * 여러 프롬프트 로그를 한 번에 DB에 저장한다 (배치 삽입).
 * 트랜잭션 내에서 처리하여 전체 성공 또는 전체 실패를 보장한다.
 *
 * @returns 삽입된 레코드 목록
 */
export function insertPromptLogBatch(inputs: PromptLogInput[]): PromptLogInsertResult[] {
  if (isDemoMode()) return inputs.map((i) => ({ id: 0, session_id: i.session_id, timestamp: new Date().toISOString() }));
  const db = getDb()!;
  const results: PromptLogInsertResult[] = [];

  const insertBatch = db.transaction(() => {
    for (const input of inputs) {
      results.push(insertPromptLog(input));
    }
  });

  insertBatch();
  return results;
}

export function getPromptLogs(filters?: PromptLogFilters): PromptLogListResponse {
  if (isDemoMode()) return mockPromptLogListResponse;
  const db = getDb()!;
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

  // Count total
  const countRow = db
    .prepare(`
      SELECT COUNT(*) as total
      FROM prompt_logs p
      LEFT JOIN sessions s ON p.session_id = s.session_id
      ${where}
    `)
    .get(...params) as { total: number };

  const total = countRow.total;
  const totalPages = Math.ceil(total / limit);

  // Fetch page
  const logs = db
    .prepare(`
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
    `)
    .all(...params, limit, offset) as PromptLog[];

  return { logs, total, page, limit, totalPages };
}

export function getPromptLogDetail(logId: number): PromptLogDetail | null {
  if (isDemoMode()) return null;
  const db = getDb()!;

  const log = db
    .prepare(`
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
    `)
    .get(logId) as PromptLogDetail | undefined;

  if (!log) return null;

  // prompt_logs 에 response_text 가 없으면 events 에서 Stop 이벤트를 조회하여 보충
  if (!log.response_text && log.event_id) {
    const response = db
      .prepare(`
        SELECT
          e2.raw_data,
          e2.timestamp as response_timestamp
        FROM events e2
        WHERE e2.session_id = ?
          AND e2.event_type = 'Stop'
          AND e2.timestamp > ?
        ORDER BY e2.timestamp ASC
        LIMIT 1
      `)
      .get(log.session_id, log.timestamp) as { raw_data: string | null; response_timestamp: string } | undefined;

    if (response) {
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

export function getPromptLogUsers(): string[] {
  if (isDemoMode()) return mockPromptLogUsers;
  const db = getDb()!;
  const rows = db
    .prepare(`
      SELECT DISTINCT user_id
      FROM events
      WHERE event_type = 'UserPromptSubmit' AND prompt_text IS NOT NULL
      ORDER BY user_id
    `)
    .all() as Array<{ user_id: string }>;
  return rows.map((r) => r.user_id);
}

export function getPromptLogProjects(): string[] {
  if (isDemoMode()) return mockPromptLogProjects;
  const db = getDb()!;
  const rows = db
    .prepare(`
      SELECT DISTINCT project_path
      FROM events
      WHERE event_type = 'UserPromptSubmit' AND prompt_text IS NOT NULL AND project_path IS NOT NULL
      ORDER BY project_path
    `)
    .all() as Array<{ project_path: string }>;
  return rows.map((r) => r.project_path);
}

// ── 채택률 (Adoption) ──

/** 전체 채택률 요약 데이터 조회 */
export function getAdoptionSummary(filters?: AdoptionFilterParams): AdoptionSummary {
  if (isDemoMode()) return mockAdoptionSummary;
  const db = getDb()!;
  const userConditions: string[] = [];
  const userParams: unknown[] = [];

  if (filters?.userId) {
    userConditions.push("user_id = ?");
    userParams.push(filters.userId);
  }

  const userWhere = userConditions.length > 0 ? `AND ${userConditions.join(" AND ")}` : "";

  // 전체 고유 사용자 수
  const totalUsersRow = db
    .prepare(`SELECT COUNT(DISTINCT user_id) as cnt FROM sessions WHERE 1=1 ${userWhere}`)
    .get(...userParams) as { cnt: number };

  // DAU: 오늘 활성 사용자
  const dauRow = db
    .prepare(`
      SELECT COUNT(DISTINCT user_id) as cnt FROM sessions
      WHERE date(started_at) = date('now') ${userWhere}
    `)
    .get(...userParams) as { cnt: number };

  // WAU: 최근 7일 활성 사용자
  const wauRow = db
    .prepare(`
      SELECT COUNT(DISTINCT user_id) as cnt FROM sessions
      WHERE started_at >= datetime('now', '-7 days') ${userWhere}
    `)
    .get(...userParams) as { cnt: number };

  // MAU: 최근 30일 활성 사용자
  const mauRow = db
    .prepare(`
      SELECT COUNT(DISTINCT user_id) as cnt FROM sessions
      WHERE started_at >= datetime('now', '-30 days') ${userWhere}
    `)
    .get(...userParams) as { cnt: number };

  // 전체 세션 수 + 평균 세션 시간
  const sessionStatsRow = db
    .prepare(`
      SELECT
        COUNT(*) as total_sessions,
        COALESCE(AVG(
          CASE WHEN ended_at IS NOT NULL
            THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
            ELSE NULL
          END
        ), 0) as avg_duration_min
      FROM sessions
      WHERE 1=1 ${userWhere}
    `)
    .get(...userParams) as { total_sessions: number; avg_duration_min: number };

  // 사용자당 평균 일일 세션 수 (최근 30일 기준)
  const avgDailyRow = db
    .prepare(`
      SELECT COALESCE(AVG(daily_count), 0) as avg_daily FROM (
        SELECT user_id, date(started_at) as d, COUNT(*) as daily_count
        FROM sessions
        WHERE started_at >= datetime('now', '-30 days') ${userWhere}
        GROUP BY user_id, d
      )
    `)
    .get(...userParams) as { avg_daily: number };

  // 도구별 채택률 (Top 10)
  const topTools = getFeatureUsageMetrics(filters);

  // 일별 활성 사용자 트렌드 (최근 30일)
  const trend = getDailyActiveUsersTrend(30, filters);

  return {
    active_users: {
      daily: dauRow.cnt,
      weekly: wauRow.cnt,
      monthly: mauRow.cnt,
    },
    total_users: totalUsersRow.cnt,
    total_sessions: sessionStatsRow.total_sessions,
    avg_session_duration_min: Math.round(sessionStatsRow.avg_duration_min * 10) / 10,
    avg_daily_sessions_per_user: Math.round(avgDailyRow.avg_daily * 10) / 10,
    top_tools: topTools,
    trend,
  };
}

/** 일별 활성 사용자 트렌드 */
export function getDailyActiveUsersTrend(days: number = 30, filters?: AdoptionFilterParams): ActiveUsersMetric[] {
  if (isDemoMode()) return mockActiveUsersMetrics;
  const db = getDb()!;
  const userConditions: string[] = [];
  const userParams: unknown[] = [];

  if (filters?.userId) {
    userConditions.push("s.user_id = ?");
    userParams.push(filters.userId);
  }

  const userWhere = userConditions.length > 0 ? `AND ${userConditions.join(" AND ")}` : "";

  const rows = db
    .prepare(`
      SELECT
        date(s.started_at) as period_start,
        COUNT(DISTINCT s.user_id) as active_users,
        COUNT(*) as total_sessions
      FROM sessions s
      WHERE s.started_at >= datetime('now', '-' || ? || ' days') ${userWhere}
      GROUP BY date(s.started_at)
      ORDER BY period_start ASC
    `)
    .all(days, ...userParams) as Array<{ period_start: string; active_users: number; total_sessions: number }>;

  return rows.map((r) => ({
    period: "day" as const,
    period_start: r.period_start,
    active_users: r.active_users,
    total_sessions: r.total_sessions,
    avg_sessions_per_user: r.active_users > 0
      ? Math.round((r.total_sessions / r.active_users) * 10) / 10
      : 0,
  }));
}

/** 기능(도구)별 채택률 메트릭 */
export function getFeatureUsageMetrics(filters?: AdoptionFilterParams): FeatureUsageMetric[] {
  if (isDemoMode()) return mockFeatureUsageMetrics;
  const db = getDb()!;
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
    // 기본 최근 30일
    conditions.push("e.timestamp >= datetime('now', '-30 days')");
  }
  if (filters?.until) {
    conditions.push("e.timestamp <= ?");
    params.push(filters.until);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  // 전체 활성 사용자 수 (해당 기간 도구를 사용한 사용자)
  const totalUsersRow = db
    .prepare(`SELECT COUNT(DISTINCT e.user_id) as cnt FROM events e ${where}`)
    .get(...params) as { cnt: number };

  const totalActiveUsers = totalUsersRow.cnt || 1; // avoid division by zero

  // 도구별 고유 사용자 수와 총 사용 횟수
  const rows = db
    .prepare(`
      SELECT
        e.tool_name,
        COUNT(DISTINCT e.user_id) as unique_users,
        COUNT(*) as total_uses
      FROM events e
      ${where}
      GROUP BY e.tool_name
      ORDER BY unique_users DESC, total_uses DESC
      LIMIT 15
    `)
    .all(...params) as Array<{ tool_name: string; unique_users: number; total_uses: number }>;

  return rows.map((r) => ({
    tool_name: r.tool_name,
    unique_users: r.unique_users,
    adoption_rate: Math.round((r.unique_users / totalActiveUsers) * 100),
    total_uses: r.total_uses,
    avg_uses_per_user: r.unique_users > 0
      ? Math.round((r.total_uses / r.unique_users) * 10) / 10
      : 0,
  }));
}

/** 사용자별 세션 빈도 메트릭 */
export function getSessionFrequencyMetrics(filters?: AdoptionFilterParams): SessionFrequencyMetric[] {
  if (isDemoMode()) return mockSessionFrequencyMetrics;
  const db = getDb()!;
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

  const rows = db
    .prepare(`
      SELECT
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
      ORDER BY session_count DESC
    `)
    .all(...params) as Array<{
      user_id: string;
      session_count: number;
      avg_duration_min: number;
      avg_turns_per_session: number;
      avg_events_per_session: number;
      last_active: string;
      active_days: number;
    }>;

  return rows.map((r) => ({
    user_id: r.user_id,
    session_count: r.session_count,
    avg_duration_min: Math.round(r.avg_duration_min * 10) / 10,
    avg_turns_per_session: Math.round(r.avg_turns_per_session * 10) / 10,
    avg_events_per_session: Math.round(r.avg_events_per_session * 10) / 10,
    last_active: r.last_active,
    active_days: r.active_days,
  }));
}

/** 사용자별 참여 깊이 메트릭 */
export function getEngagementMetrics(filters?: AdoptionFilterParams): EngagementMetric[] {
  if (isDemoMode()) return mockEngagementMetrics;
  const db = getDb()!;
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

  const rows = db
    .prepare(`
      SELECT
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
      ORDER BY total_events DESC
    `)
    .all(...params) as Array<{
      user_id: string;
      unique_tools_used: number;
      total_events: number;
      total_sessions: number;
      avg_tool_diversity: number | null;
      total_turns: number;
    }>;

  return rows.map((r) => ({
    user_id: r.user_id,
    unique_tools_used: r.unique_tools_used,
    total_events: r.total_events,
    total_sessions: r.total_sessions,
    avg_tool_diversity: Math.round((r.avg_tool_diversity ?? 0) * 10) / 10,
    total_turns: r.total_turns,
  }));
}

/** 주간 코호트 기반 리텐션 메트릭 */
export function getRetentionMetrics(weeks: number = 8, filters?: AdoptionFilterParams): RetentionMetric[] {
  if (isDemoMode()) return mockRetentionMetrics;
  const db = getDb()!;
  const userCondition = filters?.userId ? "AND user_id = ?" : "";
  const userParams = filters?.userId ? [filters.userId] : [];

  // 각 사용자의 첫 활동 주(코호트)와 이후 활동 주 계산
  const rows = db
    .prepare(`
      WITH user_cohorts AS (
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
      ORDER BY uwa.cohort_start ASC, uwa.weeks_after ASC
    `)
    .all(...userParams, ...userParams, weeks) as Array<{
      cohort_start: string;
      weeks_after: number;
      retained_users: number;
      cohort_size: number;
    }>;

  return rows.map((r) => ({
    cohort_start: r.cohort_start,
    weeks_after: r.weeks_after,
    retained_users: r.retained_users,
    cohort_size: r.cohort_size,
    retention_rate: r.cohort_size > 0
      ? Math.round((r.retained_users / r.cohort_size) * 100)
      : 0,
  }));
}

// ── 채택률 스냅샷 ──

/** 채택률 스냅샷 저장 (일일 배치 또는 수동 호출) */
export function saveAdoptionSnapshot(
  period: AdoptionPeriod = "day",
  date?: string
): void {
  if (isDemoMode()) return;
  const db = getDb()!;
  const snapshotDate = date ?? new Date().toISOString().split("T")[0];
  const summary = getAdoptionSummary();

  const activeUsersValue =
    period === "day"
      ? summary.active_users.daily
      : period === "week"
        ? summary.active_users.weekly
        : summary.active_users.monthly;

  // 세션당 평균 턴 수
  const avgTurnsRow = db
    .prepare(`
      SELECT COALESCE(AVG(num_turns), 0) as avg_turns
      FROM sessions
      WHERE num_turns IS NOT NULL
    `)
    .get() as { avg_turns: number };

  db.prepare(`
    INSERT OR REPLACE INTO adoption_snapshots
      (snapshot_date, period, active_users, total_sessions, total_users,
       avg_session_duration_min, avg_sessions_per_user, avg_turns_per_session, top_tools_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    snapshotDate,
    period,
    activeUsersValue,
    summary.total_sessions,
    summary.total_users,
    summary.avg_session_duration_min,
    summary.avg_daily_sessions_per_user,
    Math.round(avgTurnsRow.avg_turns * 10) / 10,
    JSON.stringify(summary.top_tools),
  );
}

/** 저장된 채택률 스냅샷 조회 */
export function getAdoptionSnapshots(
  period: AdoptionPeriod = "day",
  limit: number = 30
): AdoptionSnapshot[] {
  if (isDemoMode()) return mockAdoptionSnapshots.filter((s) => s.period === period).slice(0, limit);
  const db = getDb()!;
  return db
    .prepare(`
      SELECT * FROM adoption_snapshots
      WHERE period = ?
      ORDER BY snapshot_date DESC
      LIMIT ?
    `)
    .all(period, limit) as AdoptionSnapshot[];
}
