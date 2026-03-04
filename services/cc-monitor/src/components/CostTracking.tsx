import { useCallback, useEffect, useState } from "react";
import type { CostResponse, CostSummary, ModelCostBreakdown, DailyCost } from "@/lib/types";

interface CostTrackingProps {
  userId?: string;
}

function formatCost(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}

function CostSummaryCards({ summary }: { summary: CostSummary }) {
  return (
    <div style={styles.summaryGrid}>
      <div style={{ ...styles.summaryCard, ...styles.totalCard }}>
        <span style={styles.summaryLabel}>Total Cost</span>
        <span style={styles.totalValue}>{formatCost(summary.totalCost)}</span>
      </div>
      <div style={styles.summaryCard}>
        <span style={styles.summaryLabel}>Input</span>
        <span style={styles.summaryValue}>{formatCost(summary.inputCost)}</span>
      </div>
      <div style={styles.summaryCard}>
        <span style={styles.summaryLabel}>Output</span>
        <span style={styles.summaryValue}>{formatCost(summary.outputCost)}</span>
      </div>
      <div style={styles.summaryCard}>
        <span style={styles.summaryLabel}>Cache Write</span>
        <span style={styles.summaryValue}>{formatCost(summary.cacheWriteCost)}</span>
      </div>
      <div style={styles.summaryCard}>
        <span style={styles.summaryLabel}>Cache Read</span>
        <span style={styles.summaryValue}>{formatCost(summary.cacheReadCost)}</span>
      </div>
      <div style={styles.summaryCard}>
        <span style={styles.summaryLabel}>Avg/Session</span>
        <span style={styles.summaryValue}>{formatCost(summary.avgCostPerSession)}</span>
      </div>
      <div style={styles.summaryCard}>
        <span style={styles.summaryLabel}>Avg/Turn</span>
        <span style={styles.summaryValue}>{formatCost(summary.avgCostPerTurn)}</span>
      </div>
      <div style={styles.summaryCard}>
        <span style={styles.summaryLabel}>Sessions</span>
        <span style={styles.summaryValue}>{summary.sessionCount}</span>
      </div>
    </div>
  );
}

function ModelBreakdown({ models }: { models: ModelCostBreakdown[] }) {
  if (models.length === 0) return null;

  const maxCost = Math.max(...models.map((m) => m.totalCost));

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>MODEL BREAKDOWN</h3>
      {models.map((m) => {
        const pct = maxCost > 0 ? (m.totalCost / maxCost) * 100 : 0;
        return (
          <div key={m.modelId} style={styles.modelRow}>
            <div style={styles.modelInfo}>
              <span style={styles.modelName}>
                {m.displayName}
                {!m.isKnownModel && <span style={styles.unknownBadge}> (est.)</span>}
              </span>
              <span style={styles.modelMeta}>
                {m.sessionCount} sessions
              </span>
            </div>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.bar,
                  width: `${Math.max(pct, 2)}%`,
                  background: m.isKnownModel ? "#238636" : "#8b8000",
                }}
              />
            </div>
            <span style={styles.modelCost}>{formatCost(m.totalCost)}</span>
          </div>
        );
      })}
    </div>
  );
}

function DailyCostChart({ daily }: { daily: DailyCost[] }) {
  if (daily.length === 0) return null;

  const maxCost = Math.max(...daily.map((d) => d.totalCost));

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>DAILY COST TREND</h3>
      <div style={styles.dailyChart}>
        {daily.map((d) => {
          const pct = maxCost > 0 ? (d.totalCost / maxCost) * 100 : 0;
          return (
            <div key={d.date} style={styles.dailyCol} title={`${d.date}: ${formatCost(d.totalCost)} (${d.sessionCount} sessions)`}>
              <div style={styles.dailyBarWrapper}>
                <div
                  style={{
                    ...styles.dailyBar,
                    height: `${Math.max(pct, 3)}%`,
                  }}
                />
              </div>
              <span style={styles.dailyLabel}>{d.date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PricingTable({ table }: { table: CostResponse["pricingTable"] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.section}>
      <div style={styles.pricingHeader}>
        <h3 style={styles.sectionTitle}>PRICING TABLE</h3>
        <button onClick={() => setExpanded(!expanded)} style={styles.toggleBtn}>
          {expanded ? "Hide" : "Show"}
        </button>
      </div>
      {expanded && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Model</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Input</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Output</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Cache Write</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Cache Read</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.modelId}>
                  <td style={styles.td}>{row.displayName}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>${row.inputPerMTok}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>${row.outputPerMTok}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>${row.cacheWritePerMTok}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>${row.cacheReadPerMTok}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={styles.pricingNote}>단위: $/MTok (1M 토큰 당)</p>
        </div>
      )}
    </div>
  );
}

export function CostTracking({ userId }: CostTrackingProps) {
  const [data, setData] = useState<CostResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (days) params.set("days", String(days));
      const qs = params.toString();
      const res = await fetch(`/api/cost${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as CostResponse;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cost data");
    } finally {
      setLoading(false);
    }
  }, [userId, days]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <section>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>COST TRACKING</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={styles.daysSelect}
        >
          <option value={7}>7일</option>
          <option value={14}>14일</option>
          <option value={30}>30일</option>
          <option value={90}>90일</option>
          <option value={0}>전체</option>
        </select>
      </div>

      {loading && !data && <p style={styles.loading}>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {data && (
        <>
          <CostSummaryCards summary={data.summary} />
          <ModelBreakdown models={data.byModel} />
          <DailyCostChart daily={data.daily} />
          <PricingTable table={data.pricingTable} />
        </>
      )}

      {!loading && !error && data && data.summary.sessionCount === 0 && (
        <p style={styles.empty}>비용 데이터 없음 — 토큰 데이터가 있는 세션이 필요합니다.</p>
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
    marginBottom: 0,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  daysSelect: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#c9d1d9",
    padding: "3px 8px",
    fontSize: 11,
  },
  loading: { color: "#484f58", fontStyle: "italic", fontSize: 13 },
  error: { color: "#f85149", fontSize: 13 },
  empty: { color: "#484f58", fontStyle: "italic", fontSize: 13 },

  // Summary Grid
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "10px 8px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 6,
  },
  totalCard: {
    gridColumn: "1 / -1",
    background: "#0d2818",
    border: "1px solid #238636",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#8b949e",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#58a6ff",
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 800,
    color: "#3fb950",
  },

  // Section
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#8b949e",
    marginBottom: 8,
    textTransform: "uppercase",
  },

  // Model Breakdown
  modelRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 0",
    borderBottom: "1px solid #21262d",
  },
  modelInfo: {
    width: 140,
    flexShrink: 0,
  },
  modelName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#c9d1d9",
    display: "block",
  },
  modelMeta: {
    fontSize: 10,
    color: "#484f58",
  },
  unknownBadge: {
    fontSize: 10,
    color: "#8b8000",
    fontWeight: 400,
  },
  barContainer: {
    flex: 1,
    height: 14,
    background: "#21262d",
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },
  modelCost: {
    width: 70,
    textAlign: "right" as const,
    fontSize: 12,
    fontWeight: 700,
    color: "#3fb950",
    flexShrink: 0,
  },

  // Daily Chart
  dailyChart: {
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: 100,
    padding: "8px 0",
  },
  dailyCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
  },
  dailyBarWrapper: {
    flex: 1,
    width: "100%",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  dailyBar: {
    width: "80%",
    maxWidth: 20,
    background: "#238636",
    borderRadius: "2px 2px 0 0",
    transition: "height 0.3s ease",
  },
  dailyLabel: {
    fontSize: 9,
    color: "#484f58",
    marginTop: 4,
    whiteSpace: "nowrap",
  },

  // Pricing Table
  pricingHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#8b949e",
    padding: "2px 10px",
    fontSize: 10,
    cursor: "pointer",
  },
  tableWrapper: {
    marginTop: 8,
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 11,
  },
  th: {
    padding: "6px 8px",
    borderBottom: "1px solid #30363d",
    color: "#8b949e",
    fontWeight: 600,
    textAlign: "left" as const,
  },
  td: {
    padding: "5px 8px",
    borderBottom: "1px solid #21262d",
    color: "#c9d1d9",
  },
  pricingNote: {
    fontSize: 10,
    color: "#484f58",
    marginTop: 6,
    fontStyle: "italic",
  },
};
