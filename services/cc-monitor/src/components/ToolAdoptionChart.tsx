import type { FeatureUsageMetric } from "@/lib/types";

interface ToolAdoptionChartProps {
  tools: FeatureUsageMetric[];
}

export function ToolAdoptionChart({ tools }: ToolAdoptionChartProps) {
  if (tools.length === 0) {
    return (
      <section>
        <h2 style={styles.title}>FEATURE ADOPTION RATE</h2>
        <p style={styles.empty}>기능별 채택률 데이터 없음</p>
      </section>
    );
  }

  const maxRate = Math.max(...tools.map((t) => t.adoption_rate), 1);

  return (
    <section>
      <h2 style={styles.title}>FEATURE ADOPTION RATE</h2>
      <p style={styles.subtitle}>최근 30일 기준 도구별 사용자 채택률</p>
      <div style={styles.list}>
        {tools.map((tool) => {
          const barColor = getAdoptionColor(tool.adoption_rate);
          return (
            <div key={tool.tool_name} style={styles.row}>
              <span style={styles.toolName}>{tool.tool_name}</span>
              <div style={styles.barSection}>
                <div style={styles.barContainer}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${(tool.adoption_rate / maxRate) * 100}%`,
                      background: barColor,
                    }}
                  />
                </div>
                <span style={{ ...styles.rateValue, color: barColor }}>
                  {tool.adoption_rate}%
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detail}>
                  {tool.unique_users}명
                </span>
                <span style={styles.detailSep}>·</span>
                <span style={styles.detail}>
                  {formatNumber(tool.total_uses)}회
                </span>
                <span style={styles.detailSep}>·</span>
                <span style={styles.detail}>
                  avg {tool.avg_uses_per_user}/user
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getAdoptionColor(rate: number): string {
  if (rate >= 80) return "#3fb950"; // green - high adoption
  if (rate >= 50) return "#58a6ff"; // blue - moderate
  if (rate >= 25) return "#d29922"; // yellow - growing
  return "#8957e5"; // purple - low adoption
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#8b949e",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#484f58",
    marginBottom: 12,
  },
  empty: { color: "#484f58", fontStyle: "italic", fontSize: 13 },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  row: {
    padding: "8px 12px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 6,
  },
  toolName: {
    fontSize: 12,
    color: "#c9d1d9",
    fontWeight: 600,
    display: "block",
    marginBottom: 4,
  },
  barSection: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  barContainer: {
    flex: 1,
    height: 12,
    background: "#21262d",
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 6,
    transition: "width 0.3s ease",
    minWidth: 2,
  },
  rateValue: {
    fontSize: 12,
    fontWeight: 700,
    minWidth: 36,
    textAlign: "right",
  },
  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  detail: {
    fontSize: 10,
    color: "#8b949e",
  },
  detailSep: {
    fontSize: 10,
    color: "#30363d",
  },
};
