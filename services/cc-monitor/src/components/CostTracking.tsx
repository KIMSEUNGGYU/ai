import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { costQueryOptions } from "@/lib/query-options";
import type { CostResponse, CostSummary, ModelCostBreakdown, DailyCost } from "@/lib/types";

interface CostTrackingProps {
  userId?: string;
  days?: number;
}

function formatCost(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}

function CostSummaryCards({ summary }: { summary: CostSummary }) {
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      <div className="col-span-full flex flex-col items-center gap-1 px-2 py-2.5 bg-green-900/30 border border-green-700 rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Total Cost</span>
        <span className="text-[28px] font-extrabold text-green-400">{formatCost(summary.totalCost)}</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Input</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.inputCost)}</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Output</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.outputCost)}</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Cache Write</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.cacheWriteCost)}</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Cache Read</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.cacheReadCost)}</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Avg/Session</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.avgCostPerSession)}</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Avg/Turn</span>
        <span className="text-base font-bold text-blue-400">{formatCost(summary.avgCostPerTurn)}</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Sessions</span>
        <span className="text-base font-bold text-blue-400">{summary.sessionCount}</span>
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

function PricingTable({ table }: { table: CostResponse["pricingTable"] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">PRICING TABLE</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="bg-transparent border border-border rounded px-2.5 py-0.5 text-[10px] text-muted-foreground cursor-pointer hover:border-muted-foreground/60 transition-colors"
        >
          {expanded ? "Hide" : "Show"}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="px-2 py-1.5 border-b border-border text-left text-muted-foreground font-semibold">Model</th>
                <th className="px-2 py-1.5 border-b border-border text-right text-muted-foreground font-semibold">Input</th>
                <th className="px-2 py-1.5 border-b border-border text-right text-muted-foreground font-semibold">Output</th>
                <th className="px-2 py-1.5 border-b border-border text-right text-muted-foreground font-semibold">Cache Write</th>
                <th className="px-2 py-1.5 border-b border-border text-right text-muted-foreground font-semibold">Cache Read</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.modelId}>
                  <td className="px-2 py-[5px] border-b border-border/60 text-foreground">{row.displayName}</td>
                  <td className="px-2 py-[5px] border-b border-border/60 text-foreground text-right">${row.inputPerMTok}</td>
                  <td className="px-2 py-[5px] border-b border-border/60 text-foreground text-right">${row.outputPerMTok}</td>
                  <td className="px-2 py-[5px] border-b border-border/60 text-foreground text-right">${row.cacheWritePerMTok}</td>
                  <td className="px-2 py-[5px] border-b border-border/60 text-foreground text-right">${row.cacheReadPerMTok}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5 italic">단위: $/MTok (1M 토큰 당)</p>
        </div>
      )}
    </div>
  );
}

export function CostTracking({ userId, days }: CostTrackingProps) {
  const { data, isLoading, error } = useQuery(costQueryOptions({ userId, days }));

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground">COST TRACKING</h2>
      </div>

      {isLoading && !data && <p className="text-muted-foreground/60 italic text-[13px]">Loading...</p>}
      {error && <p className="text-red-400 text-[13px]">{error.message}</p>}

      {data && (
        <>
          <CostSummaryCards summary={data.summary} />
          <ModelBreakdown models={data.byModel} />
          <DailyCostChart daily={data.daily} />
          <PricingTable table={data.pricingTable} />
        </>
      )}

      {!isLoading && !error && data && data.summary.sessionCount === 0 && (
        <p className="text-muted-foreground/60 italic text-[13px]">비용 데이터 없음 -- 토큰 데이터가 있는 세션이 필요합니다.</p>
      )}
    </section>
  );
}
