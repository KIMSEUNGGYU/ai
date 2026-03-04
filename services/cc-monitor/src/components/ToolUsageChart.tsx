import type { ToolUsageStat, ToolDurationStat } from "@/lib/types";

interface ToolUsageChartProps {
  tools: ToolUsageStat[];
  durations: ToolDurationStat[];
}

export function ToolUsageChart({ tools, durations }: ToolUsageChartProps) {
  const maxCount = tools.length > 0 ? tools[0].count : 1;
  const durationMap = new Map(durations.map((d) => [d.tool_name, d]));

  return (
    <section>
      <h2 style={styles.title}>TOP TOOLS</h2>
      <div style={styles.list}>
        {tools.length === 0 && (
          <p style={styles.empty}>데이터 없음</p>
        )}
        {tools.map((t) => {
          const dur = durationMap.get(t.tool_name);
          return (
            <div key={t.tool_name} style={styles.row}>
              <span style={styles.name}>{t.tool_name}</span>
              <div style={styles.barContainer}>
                <div
                  style={{
                    ...styles.bar,
                    width: `${(t.count / maxCount) * 100}%`,
                  }}
                />
              </div>
              <span style={styles.count}>{t.count}</span>
              {dur && (
                <span style={styles.avgDuration}>
                  avg {formatMs(dur.avg_ms)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
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
  },
  name: { minWidth: 80, color: "#c9d1d9", fontWeight: 500 },
  barContainer: {
    flex: 1,
    height: 14,
    background: "#21262d",
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    background: "#8957e5",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },
  count: { minWidth: 30, textAlign: "right", color: "#8b949e", fontSize: 11 },
  avgDuration: {
    minWidth: 60,
    textAlign: "right",
    color: "#d29922",
    fontSize: 10,
  },
};
