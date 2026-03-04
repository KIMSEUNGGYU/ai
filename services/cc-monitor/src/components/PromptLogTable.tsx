import type { PromptLog } from "@/lib/types";

interface PromptLogTableProps {
  logs: PromptLog[];
  onSelect: (log: PromptLog) => void;
  selectedId: number | null;
}

function shortenPath(p: string): string {
  return p.replace(/^\/Users\/[^/]+\//, "~/");
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return d.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }) + " " + d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PromptLogTable({ logs, onSelect, selectedId }: PromptLogTableProps) {
  if (logs.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <p style={styles.emptyText}>프롬프트 로그가 없습니다</p>
        <p style={styles.emptySubtext}>필터 조건을 변경하거나 Claude Code 사용 후 확인하세요</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>시간</th>
            <th style={styles.th}>사용자</th>
            <th style={styles.th}>프롬프트</th>
            <th style={styles.th}>프로젝트</th>
            <th style={styles.th}>모델</th>
            <th style={styles.thStatus}>상태</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isSelected = log.id === selectedId;
            return (
              <tr
                key={log.id}
                onClick={() => onSelect(log)}
                style={{
                  ...styles.tr,
                  ...(isSelected ? styles.trSelected : {}),
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = "#1c2128";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                <td style={styles.tdTime}>{formatTimestamp(log.timestamp)}</td>
                <td style={styles.tdUser}>{log.user_id}</td>
                <td style={styles.tdPrompt} title={log.prompt_text}>
                  {truncateText(log.prompt_text, 80)}
                </td>
                <td style={styles.tdProject}>{shortenPath(log.project_path)}</td>
                <td style={styles.tdModel}>{log.session_model ?? log.model ?? "-"}</td>
                <td style={styles.tdStatus}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(log.session_status === "active"
                        ? styles.statusActive
                        : styles.statusEnded),
                    }}
                  >
                    {log.session_status ?? "-"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    overflowX: "auto",
    border: "1px solid #30363d",
    borderRadius: 8,
    background: "#0d1117",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 600,
    color: "#8b949e",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #30363d",
    background: "#161b22",
    whiteSpace: "nowrap",
  },
  thStatus: {
    textAlign: "center",
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 600,
    color: "#8b949e",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #30363d",
    background: "#161b22",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #21262d",
    transition: "background 0.15s",
  },
  trSelected: {
    background: "#1f2937",
    borderLeft: "3px solid #58a6ff",
  },
  tdTime: {
    padding: "8px 12px",
    color: "#484f58",
    whiteSpace: "nowrap",
    fontSize: 11,
  },
  tdUser: {
    padding: "8px 12px",
    color: "#58a6ff",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  tdPrompt: {
    padding: "8px 12px",
    color: "#c9d1d9",
    maxWidth: 400,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tdProject: {
    padding: "8px 12px",
    color: "#8b949e",
    fontSize: 11,
    whiteSpace: "nowrap",
    fontFamily: "monospace",
  },
  tdModel: {
    padding: "8px 12px",
    color: "#d2a8ff",
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  tdStatus: {
    padding: "8px 12px",
    textAlign: "center",
  },
  statusBadge: {
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  statusActive: {
    background: "#0f2d1a",
    color: "#3fb950",
    border: "1px solid #238636",
  },
  statusEnded: {
    background: "#1c1c1c",
    color: "#8b949e",
    border: "1px solid #30363d",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 8,
  },
  emptyText: {
    color: "#8b949e",
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#484f58",
    fontSize: 12,
  },
};
