import { getDb } from "./db";
import type {
  StoredEvent,
  Session,
  ToolUsageStat,
  HourlyActivity,
  UserSummary,
  ToolDurationStat,
  TokenUsageSummary,
  FilterParams,
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
  const db = getDb();
  db.prepare(`
    INSERT INTO events (session_id, event_type, user_id, project_path, tool_name, tool_input_summary, model, prompt_text, permission_mode, tool_use_id, tool_duration_ms, timestamp, raw_data)
    VALUES (@session_id, @event_type, @user_id, @project_path, @tool_name, @tool_input_summary, @model, @prompt_text, @permission_mode, @tool_use_id, @tool_duration_ms, @timestamp, @raw_data)
  `).run(event);
}

export function calcToolDuration(toolUseId: string, postTimestamp: string): number | null {
  const db = getDb();
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
  const db = getDb();
  const { clause, params } = buildFilterClause(filters);
  return db
    .prepare(`SELECT * FROM events WHERE 1=1 ${clause} ORDER BY timestamp DESC LIMIT ?`)
    .all(...params, limit) as StoredEvent[];
}

export function getEventsSince(since: string, limit: number = 100, filters?: FilterParams): StoredEvent[] {
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
  const row = db
    .prepare("SELECT transcript_path FROM sessions WHERE session_id = ?")
    .get(sessionId) as { transcript_path: string | null } | undefined;
  return row?.transcript_path ?? null;
}

export function getTokenUsageSummary(filters?: FilterParams): TokenUsageSummary {
  const db = getDb();
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
