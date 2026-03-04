import Database from "better-sqlite3";
import path from "node:path";

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
`;

function migrate(db: Database.Database) {
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
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "cc-monitor.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(TABLES);
    migrate(db);
    db.exec(INDEXES);
  }
  return db;
}
