import type { UserSummary as UserSummaryType } from "@/lib/types";

interface UserSummaryProps {
  users: UserSummaryType[];
}

export function UserSummary({ users }: UserSummaryProps) {
  return (
    <section>
      <h2 style={styles.title}>USERS</h2>
      <div style={styles.list}>
        {users.length === 0 && (
          <p style={styles.empty}>사용자 없음</p>
        )}
        {users.map((u) => (
          <div key={u.user_id} style={styles.row}>
            <span style={styles.name}>{u.user_id}</span>
            <span style={styles.stat}>
              {u.active_sessions} ses &nbsp; {u.total_events} events
            </span>
          </div>
        ))}
      </div>
    </section>
  );
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
    justifyContent: "space-between",
    fontSize: 12,
    padding: "6px 12px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 6,
  },
  name: { color: "#58a6ff", fontWeight: 500 },
  stat: { color: "#8b949e", fontSize: 11 },
};
