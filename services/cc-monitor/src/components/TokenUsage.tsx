import type { TokenUsageSummary } from "@/lib/types";

interface TokenUsageProps {
  usage: TokenUsageSummary;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function TokenUsage({ usage }: TokenUsageProps) {
  const hasData = usage.session_count > 0;

  return (
    <section>
      <h2 style={styles.title}>TOKEN USAGE</h2>
      {!hasData ? (
        <p style={styles.empty}>토큰 데이터 없음</p>
      ) : (
        <div style={styles.grid}>
          <div style={styles.card}>
            <span style={styles.label}>Input</span>
            <span style={styles.value}>{formatTokens(usage.input_tokens)}</span>
          </div>
          <div style={styles.card}>
            <span style={styles.label}>Output</span>
            <span style={styles.value}>{formatTokens(usage.output_tokens)}</span>
          </div>
          <div style={styles.card}>
            <span style={styles.label}>Cache Write</span>
            <span style={styles.value}>{formatTokens(usage.cache_create_tokens)}</span>
          </div>
          <div style={styles.card}>
            <span style={styles.label}>Cache Read</span>
            <span style={styles.value}>{formatTokens(usage.cache_read_tokens)}</span>
          </div>
          <div style={styles.card}>
            <span style={styles.label}>Turns</span>
            <span style={styles.value}>{usage.turns}</span>
          </div>
          <div style={styles.card}>
            <span style={styles.label}>Sessions</span>
            <span style={styles.value}>{usage.session_count}</span>
          </div>
        </div>
      )}
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
  empty: { color: "#484f58", fontStyle: "italic", fontSize: 13 },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "10px 8px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    color: "#8b949e",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  value: {
    fontSize: 18,
    fontWeight: 700,
    color: "#58a6ff",
  },
};
