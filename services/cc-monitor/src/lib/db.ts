import path from "node:path";

// better-sqlite3 타입 — Vercel에서는 타입만 사용하고 런타임에는 로드하지 않음
type BetterSqlite3Database = import("better-sqlite3").Database;

let Database: ((...args: unknown[]) => BetterSqlite3Database) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Database = require("better-sqlite3");
} catch {
  // better-sqlite3 unavailable (e.g. Vercel serverless)
}

const TABLES = `
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    project_path TEXT,
    tool_name TEXT,
    tool_input_summary TEXT,
    model TEXT,
    prompt_text TEXT,
    permission_mode TEXT,
    tool_use_id TEXT,
    tool_duration_ms INTEGER,
    timestamp TEXT NOT NULL,
    raw_data TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_path TEXT,
    model TEXT,
    permission_mode TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    transcript_path TEXT,
    total_input_tokens INTEGER,
    total_output_tokens INTEGER,
    total_cache_create_tokens INTEGER,
    total_cache_read_tokens INTEGER,
    num_turns INTEGER
  );

  CREATE TABLE IF NOT EXISTS adoption_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date TEXT NOT NULL,
    period TEXT NOT NULL CHECK(period IN ('day', 'week', 'month')),
    active_users INTEGER NOT NULL DEFAULT 0,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    total_users INTEGER NOT NULL DEFAULT 0,
    avg_session_duration_min REAL NOT NULL DEFAULT 0,
    avg_sessions_per_user REAL NOT NULL DEFAULT 0,
    avg_turns_per_session REAL NOT NULL DEFAULT 0,
    top_tools_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(snapshot_date, period)
  );

  CREATE TABLE IF NOT EXISTS prompt_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    event_id INTEGER,
    user_id TEXT NOT NULL,
    project_path TEXT,
    prompt_text TEXT NOT NULL,
    response_text TEXT,
    model TEXT,
    permission_mode TEXT,
    timestamp TEXT NOT NULL,
    response_timestamp TEXT,
    duration_ms INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cache_create_tokens INTEGER,
    cache_read_tokens INTEGER,
    turn_number INTEGER,
    cost_usd REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );
`;

const INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_events_tool ON events(tool_name);
  CREATE INDEX IF NOT EXISTS idx_events_tool_use_id ON events(tool_use_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
  CREATE INDEX IF NOT EXISTS idx_adoption_snapshots_date ON adoption_snapshots(snapshot_date);
  CREATE INDEX IF NOT EXISTS idx_adoption_snapshots_period ON adoption_snapshots(period, snapshot_date);
  CREATE INDEX IF NOT EXISTS idx_prompt_logs_session ON prompt_logs(session_id);
  CREATE INDEX IF NOT EXISTS idx_prompt_logs_user ON prompt_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_prompt_logs_timestamp ON prompt_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_prompt_logs_project ON prompt_logs(project_path);
  CREATE INDEX IF NOT EXISTS idx_prompt_logs_model ON prompt_logs(model);
  CREATE INDEX IF NOT EXISTS idx_prompt_logs_event ON prompt_logs(event_id);
`;

function migrate(db: BetterSqlite3Database) {
  const cols = db.prepare("PRAGMA table_info(events)").all() as Array<{ name: string }>;
  const colNames = new Set(cols.map((c) => c.name));

  if (!colNames.has("permission_mode")) {
    db.exec("ALTER TABLE events ADD COLUMN permission_mode TEXT");
  }
  if (!colNames.has("tool_use_id")) {
    db.exec("ALTER TABLE events ADD COLUMN tool_use_id TEXT");
  }
  if (!colNames.has("tool_duration_ms")) {
    db.exec("ALTER TABLE events ADD COLUMN tool_duration_ms INTEGER");
  }

  const sessionCols = db.prepare("PRAGMA table_info(sessions)").all() as Array<{ name: string }>;
  const sessionColNames = new Set(sessionCols.map((c) => c.name));

  if (!sessionColNames.has("permission_mode")) {
    db.exec("ALTER TABLE sessions ADD COLUMN permission_mode TEXT");
  }

  const tokenCols = ["transcript_path", "total_input_tokens", "total_output_tokens", "total_cache_create_tokens", "total_cache_read_tokens", "num_turns"];
  for (const col of tokenCols) {
    if (!sessionColNames.has(col)) {
      const type = col === "transcript_path" ? "TEXT" : "INTEGER";
      db.exec(`ALTER TABLE sessions ADD COLUMN ${col} ${type}`);
    }
  }

  // ── prompt_logs 테이블 마이그레이션 ──
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prompt_logs'").all();
  if (tables.length > 0) {
    const promptLogCols = db.prepare("PRAGMA table_info(prompt_logs)").all() as Array<{ name: string }>;
    const promptLogColNames = new Set(promptLogCols.map((c) => c.name));

    const newPromptLogCols: Array<[string, string]> = [
      ["cost_usd", "REAL"],
      ["turn_number", "INTEGER"],
      ["duration_ms", "INTEGER"],
      ["cache_create_tokens", "INTEGER"],
      ["cache_read_tokens", "INTEGER"],
    ];
    for (const [col, type] of newPromptLogCols) {
      if (!promptLogColNames.has(col)) {
        db.exec(`ALTER TABLE prompt_logs ADD COLUMN ${col} ${type}`);
      }
    }
  }
}

let db: BetterSqlite3Database | null = null;

/**
 * DB 인스턴스를 반환한다. better-sqlite3를 사용할 수 없으면 null을 반환한다.
 */
export function getDb(): BetterSqlite3Database | null {
  if (!Database) return null;

  if (!db) {
    try {
      const dbPath = path.join(process.cwd(), "cc-monitor.db");
      db = new (Database as unknown as new (filename: string) => BetterSqlite3Database)(dbPath);
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      db.exec(TABLES);
      migrate(db);
      db.exec(INDEXES);
    } catch {
      return null;
    }
  }
  return db;
}

/**
 * Demo Mode 여부를 반환한다.
 * Vercel 환경이거나 DB를 사용할 수 없을 때 true.
 */
export function isDemoMode(): boolean {
  if (process.env.VERCEL) return true;
  return getDb() === null;
}
