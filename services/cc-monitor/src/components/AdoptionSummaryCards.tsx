import type { AdoptionSummary } from "@/lib/types";

interface AdoptionSummaryCardsProps {
  summary: AdoptionSummary;
}

export function AdoptionSummaryCards({ summary }: AdoptionSummaryCardsProps) {
  const hasData = summary.total_users > 0;

  return (
    <section>
      <h2 style={styles.title}>ADOPTION OVERVIEW</h2>
      {!hasData ? (
        <p style={styles.empty}>채택률 데이터 없음</p>
      ) : (
        <>
          {/* Active Users Row */}
          <div style={styles.activeUsersRow}>
            <div style={styles.activeCard}>
              <span style={styles.activeLabel}>DAU</span>
              <span style={styles.activeValue}>{summary.active_users.daily}</span>
              <span style={styles.activeSub}>오늘</span>
            </div>
            <div style={styles.activeCard}>
              <span style={styles.activeLabel}>WAU</span>
              <span style={styles.activeValue}>{summary.active_users.weekly}</span>
              <span style={styles.activeSub}>최근 7일</span>
            </div>
            <div style={styles.activeCard}>
              <span style={styles.activeLabel}>MAU</span>
              <span style={styles.activeValue}>{summary.active_users.monthly}</span>
              <span style={styles.activeSub}>최근 30일</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>전체 사용자</span>
              <span style={styles.metricValue}>{summary.total_users}</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>전체 세션</span>
              <span style={styles.metricValue}>{formatNumber(summary.total_sessions)}</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>평균 세션 시간</span>
              <span style={styles.metricValue}>{formatDuration(summary.avg_session_duration_min)}</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>일일 평균 세션/유저</span>
              <span style={styles.metricValue}>{summary.avg_daily_sessions_per_user}</span>
            </div>
          </div>

          {/* Stickiness indicator */}
          {summary.active_users.monthly > 0 && (
            <div style={styles.stickinessRow}>
              <span style={styles.stickinessLabel}>Stickiness (DAU/MAU)</span>
              <div style={styles.stickinessBarContainer}>
                <div
                  style={{
                    ...styles.stickinessBar,
                    width: `${Math.min(100, Math.round((summary.active_users.daily / summary.active_users.monthly) * 100))}%`,
                  }}
                />
              </div>
              <span style={styles.stickinessValue}>
                {Math.round((summary.active_users.daily / summary.active_users.monthly) * 100)}%
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#8b949e",
    marginBottom: 12,
  },
  empty: { color: "#484f58", fontStyle: "italic", fontSize: 13 },
  activeUsersRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginBottom: 10,
  },
  activeCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "12px 8px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 6,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#3fb950",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  activeValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#f0f6fc",
  },
  activeSub: {
    fontSize: 9,
    color: "#484f58",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 10,
  },
  metricCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "10px 8px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#8b949e",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#58a6ff",
  },
  stickinessRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 6,
  },
  stickinessLabel: {
    fontSize: 11,
    color: "#8b949e",
    fontWeight: 500,
    minWidth: 120,
    whiteSpace: "nowrap",
  },
  stickinessBarContainer: {
    flex: 1,
    height: 10,
    background: "#21262d",
    borderRadius: 5,
    overflow: "hidden",
  },
  stickinessBar: {
    height: "100%",
    background: "linear-gradient(90deg, #3fb950, #58a6ff)",
    borderRadius: 5,
    transition: "width 0.3s ease",
  },
  stickinessValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#3fb950",
    minWidth: 36,
    textAlign: "right",
  },
};
