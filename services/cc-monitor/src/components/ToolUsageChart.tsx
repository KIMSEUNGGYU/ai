import type { ToolUsageStat } from "@/lib/types";

interface ToolUsageChartProps {
  tools: ToolUsageStat[];
}

export function ToolUsageChart({ tools }: ToolUsageChartProps) {
  const maxCount = tools.length > 0 ? tools[0].count : 1;

  return (
    <section>
      <h2 style={styles.title}>TOP TOOLS</h2>
      <div style={styles.list}>
        {tools.length === 0 && (
          <p style={styles.empty}>데이터 없음</p>
        )}
        {tools.map((t) => (
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
  count: { minWidth: 40, textAlign: "right", color: "#8b949e", fontSize: 11 },
};
