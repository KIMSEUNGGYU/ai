import { getDb } from "./db";
import type {
  StoredEvent,
  Session,
  ToolUsageStat,
  HourlyActivity,
  UserSummary,
} from "./types";

// ── 이벤트 ──

export function insertEvent(event: Omit<StoredEvent, "id">): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO events (session_id, event_type, user_id, project_path, tool_name, tool_input_summary, model, prompt_text, timestamp, raw_data)
    VALUES (@session_id, @event_type, @user_id, @project_path, @tool_name, @tool_input_summary, @model, @prompt_text, @timestamp, @raw_data)
  `).run(event);
}

export function getRecentEvents(limit: number = 50): StoredEvent[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM events ORDER BY timestamp DESC LIMIT ?")
    .all(limit) as StoredEvent[];
}

export function getEventsSince(since: string, limit: number = 100): StoredEvent[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM events WHERE timestamp > ? ORDER BY timestamp DESC LIMIT ?")
    .all(since, limit) as StoredEvent[];
}

// ── 세션 ──

export function upsertSession(session: {
  session_id: string;
  user_id?: string;
  project_path?: string;
  model?: string | null;
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

    if (updates.length > 0) {
      db.prepare(
        `UPDATE sessions SET ${updates.join(", ")} WHERE session_id = @session_id`
      ).run(values);
    }
  } else {
    db.prepare(`
      INSERT INTO sessions (session_id, user_id, project_path, model, started_at, status)
      VALUES (@session_id, @user_id, @project_path, @model, @started_at, @status)
    `).run({
      session_id: session.session_id,
      user_id: session.user_id ?? "unknown",
      project_path: session.project_path ?? "",
      model: session.model ?? null,
      started_at: session.started_at ?? new Date().toISOString(),
      status: session.status ?? "active",
    });
  }
}

export function getSessions(status: "active" | "ended" | "all" = "active"): Session[] {
  const db = getDb();

  const baseQuery = `
    SELECT
      s.*,
      COALESCE(e.event_count, 0) as event_count,
      COALESCE(e.tool_count, 0) as tool_count
    FROM sessions s
    LEFT JOIN (
      SELECT
        session_id,
        COUNT(*) as event_count,
        COUNT(CASE WHEN tool_name IS NOT NULL THEN 1 END) as tool_count
      FROM events
      GROUP BY session_id
    ) e ON s.session_id = e.session_id
  `;

  if (status === "all") {
    return db.prepare(`${baseQuery} ORDER BY s.started_at DESC`).all() as Session[];
  }

  return db
    .prepare(`${baseQuery} WHERE s.status = ? ORDER BY s.started_at DESC`)
    .all(status) as Session[];
}

// ── 분석 ──

export function getToolUsageStats(hours: number = 24): ToolUsageStat[] {
  const db = getDb();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const rows = db
    .prepare(`
      SELECT tool_name, COUNT(*) as count
      FROM events
      WHERE tool_name IS NOT NULL AND timestamp > ?
      GROUP BY tool_name
      ORDER BY count DESC
      LIMIT 10
    `)
    .all(since) as Array<{ tool_name: string; count: number }>;

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return rows.map((r) => ({
    tool_name: r.tool_name,
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }));
}

export function getHourlyActivity(hours: number = 24): HourlyActivity[] {
  const db = getDb();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  return db
    .prepare(`
      SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as count
      FROM events
      WHERE timestamp > ?
      GROUP BY hour
      ORDER BY hour
    `)
    .all(since) as HourlyActivity[];
}

export function getUserSummaries(): UserSummary[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT
        e.user_id,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.session_id END) as active_sessions,
        COUNT(*) as total_events,
        MAX(e.timestamp) as last_activity
      FROM events e
      LEFT JOIN sessions s ON e.session_id = s.session_id
      GROUP BY e.user_id
      ORDER BY last_activity DESC
    `)
    .all() as UserSummary[];
}
