import { useQuery } from "@tanstack/react-query";
import { costQueryOptions } from "@/lib/query-options";
import type { CostSummary, ModelCostBreakdown, DailyCost, TokenUsageSummary } from "@/lib/types";

interface CostTrackingProps {
  userId?: string;
  days?: number;
  tokenUsage?: TokenUsageSummary;
}

function formatCost(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function SummaryCards({ summary, tokenUsage }: { summary: CostSummary; tokenUsage?: TokenUsageSummary }) {
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {/* 총 비용 */}
      <div className="col-span-2 flex flex-col items-center gap-1 px-2 py-2.5 bg-green-900/30 border border-green-700 rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Total Cost</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-extrabold text-green-400">{formatCost(summary.totalCost)}</span>
          {tokenUsage && <span className="text-[10px] text-muted-foreground">/ {formatTokens(tokenUsage.input_tokens + tokenUsage.output_tokens + tokenUsage.cache_create_tokens + tokenUsage.cache_read_tokens)} tokens</span>}
        </div>
      </div>
      {/* 세션 / 턴 */}
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Sessions</span>
        <span className="text-base font-bold text-blue-400">{summary.sessionCount}</span>
        <span className="text-[10px] text-muted-foreground">{formatCost(summary.avgCostPerSession)}/sess</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Turns</span>
        <span className="text-base font-bold text-blue-400">{tokenUsage?.turns ?? "-"}</span>
        <span className="text-[10px] text-muted-foreground">{formatCost(summary.avgCostPerTurn)}/turn</span>
      </div>

      {/* Input: 비용 + 토큰 */}
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Input</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.inputCost)}</span>
        {tokenUsage && <span className="text-[10px] text-muted-foreground">{formatTokens(tokenUsage.input_tokens)} tok</span>}
      </div>
      {/* Output: 비용 + 토큰 */}
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Output</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.outputCost)}</span>
        {tokenUsage && <span className="text-[10px] text-muted-foreground">{formatTokens(tokenUsage.output_tokens)} tok</span>}
      </div>
      {/* Cache Write: 비용 + 토큰 */}
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Cache Write</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.cacheWriteCost)}</span>
        {tokenUsage && <span className="text-[10px] text-muted-foreground">{formatTokens(tokenUsage.cache_create_tokens)} tok</span>}
      </div>
      {/* Cache Read: 비용 + 토큰 */}
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Cache Read</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.cacheReadCost)}</span>
        {tokenUsage && <span className="text-[10px] text-muted-foreground">{formatTokens(tokenUsage.cache_read_tokens)} tok</span>}
      </div>
    </div>
  );
}

function ModelBreakdown({ models }: { models: ModelCostBreakdown[] }) {
  if (models.length === 0) return null;

  const maxCost = Math.max(...models.map((m) => m.totalCost));

  return (
    <div className="mt-4">
      <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground mb-2 uppercase">MODEL BREAKDOWN</h3>
      {models.map((m) => {
        const pct = maxCost > 0 ? (m.totalCost / maxCost) * 100 : 0;
        return (
          <div key={m.modelId} className="flex items-center gap-2 py-1.5 border-b border-border/60">
            <div className="w-[140px] shrink-0">
              <span className="text-xs font-semibold text-foreground block">
                {m.displayName}
                {!m.isKnownModel && <span className="text-[10px] text-yellow-600 font-normal"> (est.)</span>}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {m.sessionCount} sessions
              </span>
            </div>
            <div className="flex-1 h-3.5 bg-border/40 rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm transition-[width] duration-300 ease-in-out ${m.isKnownModel ? "bg-green-700" : "bg-yellow-700"}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="w-[70px] text-right text-xs font-bold text-green-400 shrink-0">{formatCost(m.totalCost)}</span>
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
    <div className="mt-4">
      <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground mb-2 uppercase">DAILY COST TREND</h3>
      <div className="flex items-end gap-0.5 h-[100px] py-2">
        {daily.map((d) => {
          const pct = maxCost > 0 ? (d.totalCost / maxCost) * 100 : 0;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center h-full" title={`${d.date}: ${formatCost(d.totalCost)} (${d.sessionCount} sessions)`}>
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className="w-4/5 max-w-5 bg-green-700 rounded-t-sm transition-[height] duration-300 ease-in-out"
                  style={{ height: `${Math.max(pct, 3)}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground/60 mt-1 whitespace-nowrap">{d.date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export function CostTracking({ userId, days, tokenUsage }: CostTrackingProps) {
  const { data, isFetching, error } = useQuery(costQueryOptions({ userId, days }));

  return (
    <section className={isFetching && data ? "opacity-70 transition-opacity" : ""}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground">COST & TOKEN USAGE</h2>
      </div>

      {!data && isFetching && <p className="text-muted-foreground/60 italic text-[13px]">Loading...</p>}
      {error && !data && <p className="text-red-400 text-[13px]">{error.message}</p>}

      {data && (
        <>
          <SummaryCards summary={data.summary} tokenUsage={tokenUsage} />
          <ModelBreakdown models={data.byModel} />
          <DailyCostChart daily={data.daily} />
        </>
      )}

      {!isFetching && !error && data && data.summary.sessionCount === 0 && (
        <p className="text-muted-foreground/60 italic text-[13px]">비용 데이터 없음 -- 토큰 데이터가 있는 세션이 필요합니다.</p>
      )}
    </section>
  );
}
