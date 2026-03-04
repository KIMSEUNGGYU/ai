import type { PromptLogDetail as PromptLogDetailType } from "@/lib/types";

interface PromptLogDetailProps {
  detail: PromptLogDetailType | null;
  loading: boolean;
  onClose: () => void;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function shortenPath(p: string): string {
  return p.replace(/^\/Users\/[^/]+\//, "~/");
}

function formatDuration(startTs: string, endTs: string): string {
  const ms = new Date(endTs).getTime() - new Date(startTs).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function PromptLogDetailPanel({ detail, loading, onClose }: PromptLogDetailProps) {
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>프롬프트 상세</h3>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>
        <div style={styles.loadingContainer}>
          <span style={styles.loadingText}>로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>프롬프트 상세</h3>
        </div>
        <div style={styles.placeholderContainer}>
          <p style={styles.placeholderText}>프롬프트를 선택하면 상세 내용이 여기에 표시됩니다</p>
        </div>
      </div>
    );
  }

  const responseDuration = detail.response_timestamp
    ? formatDuration(detail.timestamp, detail.response_timestamp)
    : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>프롬프트 상세</h3>
        <button onClick={onClose} style={styles.closeBtn}>&times;</button>
      </div>

      {/* 메타 정보 */}
      <div style={styles.metaGrid}>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>사용자</span>
          <span style={styles.metaValueUser}>{detail.user_id}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>시간</span>
          <span style={styles.metaValue}>{formatTimestamp(detail.timestamp)}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>세션</span>
          <span style={styles.metaValueMono}>{detail.session_id.slice(0, 12)}...</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>모델</span>
          <span style={styles.metaValueModel}>{detail.session_model ?? detail.model ?? "-"}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>프로젝트</span>
          <span style={styles.metaValueMono}>{shortenPath(detail.project_path)}</span>
        </div>
        {detail.permission_mode && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>권한 모드</span>
            <span style={styles.metaValueBadge}>{detail.permission_mode}</span>
          </div>
        )}
        {responseDuration && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>응답 시간</span>
            <span style={styles.metaValueDuration}>{responseDuration}</span>
          </div>
        )}
        {(detail.total_input_tokens || detail.total_output_tokens) && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>토큰 (세션)</span>
            <span style={styles.metaValue}>
              In: {detail.total_input_tokens?.toLocaleString() ?? "-"} / Out: {detail.total_output_tokens?.toLocaleString() ?? "-"}
            </span>
          </div>
        )}
      </div>

      {/* 프롬프트 */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>&#9658;</span> 프롬프트
        </h4>
        <div style={styles.promptBox}>
          <pre style={styles.promptText}>{detail.prompt_text}</pre>
        </div>
      </div>

      {/* 응답 */}
      {detail.response_text && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={styles.sectionIconResponse}>&#9668;</span> 응답 (요약)
          </h4>
          <div style={styles.responseBox}>
            <pre style={styles.responseText}>{detail.response_text}</pre>
          </div>
        </div>
      )}

      {/* 세션 정보 */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>세션 정보</h4>
        <div style={styles.sessionInfo}>
          <div style={styles.sessionRow}>
            <span style={styles.sessionLabel}>상태</span>
            <span
              style={{
                ...styles.statusBadge,
                ...(detail.session_status === "active"
                  ? styles.statusActive
                  : styles.statusEnded),
              }}
            >
              {detail.session_status ?? "-"}
            </span>
          </div>
          {detail.session_started_at && (
            <div style={styles.sessionRow}>
              <span style={styles.sessionLabel}>시작</span>
              <span style={styles.sessionValue}>{formatTimestamp(detail.session_started_at)}</span>
            </div>
          )}
          {detail.session_ended_at && (
            <div style={styles.sessionRow}>
              <span style={styles.sessionLabel}>종료</span>
              <span style={styles.sessionValue}>{formatTimestamp(detail.session_ended_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #30363d",
    background: "#0d1117",
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#8b949e",
    textTransform: "uppercase",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#8b949e",
    fontSize: 18,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  },
  loadingText: {
    color: "#484f58",
    fontSize: 13,
  },
  placeholderContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  },
  placeholderText: {
    color: "#484f58",
    fontSize: 13,
    textAlign: "center",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 1,
    padding: "1px",
    background: "#21262d",
    margin: "12px 16px",
    borderRadius: 6,
    overflow: "hidden",
  },
  metaItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "8px 12px",
    background: "#0d1117",
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#484f58",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  metaValue: {
    fontSize: 12,
    color: "#c9d1d9",
  },
  metaValueUser: {
    fontSize: 12,
    color: "#58a6ff",
    fontWeight: 500,
  },
  metaValueMono: {
    fontSize: 11,
    color: "#8b949e",
    fontFamily: "monospace",
  },
  metaValueModel: {
    fontSize: 12,
    color: "#d2a8ff",
    fontWeight: 500,
  },
  metaValueBadge: {
    fontSize: 11,
    color: "#d2a8ff",
    padding: "1px 6px",
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: 3,
    display: "inline-block",
    width: "fit-content",
  },
  metaValueDuration: {
    fontSize: 12,
    color: "#d29922",
    fontWeight: 500,
  },
  section: {
    padding: "12px 16px",
    borderTop: "1px solid #21262d",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#8b949e",
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  sectionIcon: {
    color: "#d2a8ff",
    fontSize: 10,
  },
  sectionIconResponse: {
    color: "#3fb950",
    fontSize: 10,
  },
  promptBox: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderLeft: "3px solid #d2a8ff",
    borderRadius: 6,
    padding: "12px 16px",
    maxHeight: 300,
    overflowY: "auto",
  },
  promptText: {
    fontSize: 12,
    color: "#c9d1d9",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.6,
    margin: 0,
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  responseBox: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderLeft: "3px solid #3fb950",
    borderRadius: 6,
    padding: "12px 16px",
    maxHeight: 300,
    overflowY: "auto",
  },
  responseText: {
    fontSize: 12,
    color: "#c9d1d9",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.6,
    margin: 0,
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  sessionInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sessionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  sessionLabel: {
    fontSize: 11,
    color: "#484f58",
    minWidth: 40,
  },
  sessionValue: {
    fontSize: 12,
    color: "#8b949e",
  },
  statusBadge: {
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
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
};
