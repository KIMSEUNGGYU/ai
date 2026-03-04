import type { ActiveUsersMetric } from "@/lib/types";

interface AdoptionTrendChartProps {
  trend: ActiveUsersMetric[];
}

export function AdoptionTrendChart({ trend }: AdoptionTrendChartProps) {
  if (trend.length === 0) {
    return (
      <section>
        <h2 style={styles.title}>USER ADOPTION TREND</h2>
        <p style={styles.empty}>트렌드 데이터 없음</p>
      </section>
    );
  }

  const maxUsers = Math.max(...trend.map((t) => t.active_users), 1);
  const maxSessions = Math.max(...trend.map((t) => t.total_sessions), 1);

  // Show last 14 days for readability (or all if less)
  const displayTrend = trend.length > 14 ? trend.slice(-14) : trend;

  return (
    <section>
      <h2 style={styles.title}>USER ADOPTION TREND</h2>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: "#3fb950" }} />
          <span style={styles.legendText}>활성 사용자</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: "#58a6ff" }} />
          <span style={styles.legendText}>세션 수</span>
        </div>
      </div>

      {/* Chart */}
      <div style={styles.chartContainer}>
        {/* Y-axis labels */}
        <div style={styles.yAxis}>
          <span style={styles.yLabel}>{maxUsers}</span>
          <span style={styles.yLabel}>{Math.round(maxUsers / 2)}</span>
          <span style={styles.yLabel}>0</span>
        </div>

        {/* Bars */}
        <div style={styles.chart}>
          {displayTrend.map((t) => {
            const userHeight = (t.active_users / maxUsers) * 100;
            const sessionHeight = (t.total_sessions / maxSessions) * 100;
            const dateLabel = formatDateLabel(t.period_start);

            return (
              <div key={t.period_start} style={styles.barGroup} title={`${t.period_start}\n사용자: ${t.active_users}\n세션: ${t.total_sessions}\n평균: ${t.avg_sessions_per_user}/user`}>
                <div style={styles.barPair}>
                  {/* User bar */}
                  <div
                    style={{
                      ...styles.userBar,
                      height: `${Math.max(userHeight, 2)}%`,
                    }}
                  />
                  {/* Session bar */}
                  <div
                    style={{
                      ...styles.sessionBar,
                      height: `${Math.max(sessionHeight, 2)}%`,
                    }}
                  />
                </div>
                <span style={styles.dateLabel}>{dateLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats row */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>피크 DAU</span>
          <span style={styles.statValue}>{maxUsers}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>평균 DAU</span>
          <span style={styles.statValue}>
            {trend.length > 0
              ? Math.round(trend.reduce((s, t) => s + t.active_users, 0) / trend.length * 10) / 10
              : 0}
          </span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>기간</span>
          <span style={styles.statValue}>{trend.length}일</span>
        </div>
      </div>
    </section>
  );
}

function formatDateLabel(dateStr: string): string {
  // "2026-03-04" → "3/4"
  const parts = dateStr.split("-");
  if (parts.length >= 3) {
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  }
  return dateStr;
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
  legend: {
    display: "flex",
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: "#8b949e",
  },
  chartContainer: {
    display: "flex",
    gap: 6,
    padding: "8px 0",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 6,
    paddingLeft: 4,
    paddingRight: 8,
  },
  yAxis: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 4,
    paddingBottom: 18,
    minWidth: 24,
  },
  yLabel: {
    fontSize: 8,
    color: "#484f58",
  },
  chart: {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: 100,
    borderLeft: "1px solid #21262d",
    borderBottom: "1px solid #21262d",
    paddingLeft: 2,
    paddingBottom: 0,
  },
  barGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    cursor: "default",
  },
  barPair: {
    display: "flex",
    gap: 1,
    alignItems: "flex-end",
    width: "100%",
    height: "calc(100% - 14px)",
  },
  userBar: {
    flex: 1,
    background: "#3fb950",
    borderRadius: "2px 2px 0 0",
    minHeight: 2,
    transition: "height 0.3s ease",
    opacity: 0.9,
  },
  sessionBar: {
    flex: 1,
    background: "#58a6ff",
    borderRadius: "2px 2px 0 0",
    minHeight: 2,
    transition: "height 0.3s ease",
    opacity: 0.7,
  },
  dateLabel: {
    fontSize: 7,
    color: "#484f58",
    marginTop: 2,
    whiteSpace: "nowrap",
  },
  statsRow: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 4,
    fontSize: 11,
  },
  statLabel: {
    color: "#8b949e",
    fontWeight: 500,
  },
  statValue: {
    color: "#f0f6fc",
    fontWeight: 700,
  },
};
