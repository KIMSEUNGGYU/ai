import type { Session } from "@/lib/types";

interface ActiveSessionsProps {
  sessions: Session[];
}

export function ActiveSessions({ sessions }: ActiveSessionsProps) {
  return (
    <section>
      <h2 style={styles.title}>
        ACTIVE SESSIONS{" "}
        <span style={styles.count}>({sessions.length})</span>
      </h2>
      <div style={styles.grid}>
        {sessions.length === 0 && (
          <p style={styles.empty}>활성 세션 없음</p>
        )}
        {sessions.map((s) => (
          <div key={s.session_id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.statusDot} />
              <strong>{s.user_id}</strong>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.projectPath}>
                {shortenPath(s.project_path)}
              </div>
              <div style={styles.stats}>
                Events: {s.event_count} &nbsp; Tools: {s.tool_count}
                {s.model && <> &nbsp; Model: {s.model}</>}
              </div>
              <div style={styles.duration}>{formatDuration(s.started_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function shortenPath(p: string): string {
  return p.replace(/^\/Users\/[^/]+\//, "~/");
}

function formatDuration(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#8b949e",
    marginBottom: 12,
  },
  count: { color: "#58a6ff" },
  grid: { display: "flex", flexDirection: "column", gap: 8 },
  empty: { color: "#484f58", fontStyle: "italic", fontSize: 13 },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderLeft: "3px solid #3fb950",
    borderRadius: 6,
    padding: "12px 16px",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#3fb950",
    display: "inline-block",
  },
  cardBody: { fontSize: 12, color: "#8b949e" },
  projectPath: { fontFamily: "monospace", marginBottom: 4 },
  stats: { marginBottom: 2 },
  duration: { color: "#484f58" },
};
