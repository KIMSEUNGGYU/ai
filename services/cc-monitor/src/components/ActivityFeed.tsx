import type { StoredEvent } from "@/lib/types";

interface ActivityFeedProps {
  events: StoredEvent[];
}

const EVENT_COLORS: Record<string, string> = {
  SessionStart: "#3fb950",
  SessionEnd: "#f85149",
  PreToolUse: "#58a6ff",
  PostToolUse: "#58a6ff",
  UserPromptSubmit: "#d2a8ff",
  Stop: "#f85149",
};

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <section>
      <h2 style={styles.title}>ACTIVITY FEED</h2>
      <div style={styles.list}>
        {events.length === 0 && (
          <p style={styles.empty}>이벤트 없음</p>
        )}
        {events.map((e) => (
          <div key={e.id} style={styles.row}>
            <span
              style={{
                ...styles.dot,
                background: EVENT_COLORS[e.event_type] ?? "#484f58",
              }}
            />
            <span style={styles.user}>{e.user_id}</span>
            <span style={styles.eventType}>{formatEventType(e)}</span>
            <span style={styles.time}>
              {new Date(e.timestamp).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatEventType(e: StoredEvent): string {
  if (e.tool_name) {
    const summary = e.tool_input_summary ? `: ${e.tool_input_summary}` : "";
    return `${e.event_type} → ${e.tool_name}${summary}`;
  }
  if (e.event_type === "SessionStart") return "Session started";
  if (e.event_type === "SessionEnd") return "Session ended";
  if (e.event_type === "UserPromptSubmit") return "Prompt submitted";
  if (e.event_type === "Stop") return "Stopped";
  return e.event_type;
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#8b949e",
    marginBottom: 12,
  },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  empty: { color: "#484f58", fontStyle: "italic", fontSize: 13 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    padding: "4px 0",
    borderBottom: "1px solid #21262d",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  user: { color: "#58a6ff", minWidth: 100, fontWeight: 500 },
  eventType: {
    flex: 1,
    color: "#c9d1d9",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  time: { color: "#484f58", fontSize: 11, flexShrink: 0 },
};
