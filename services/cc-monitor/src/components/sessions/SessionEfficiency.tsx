import { Separator } from "@/components/ui/separator";
import { formatTokens } from "@/lib/format";
import type { Session } from "@/lib/types";

// 모델별 컨텍스트 윈도우 크기 (토큰)
function getContextWindow(model: string | null): number {
  if (!model) return 200_000;
  if (model.includes("opus")) return 200_000;
  if (model.includes("sonnet")) return 200_000;
  if (model.includes("haiku")) return 200_000;
  return 200_000;
}

// 컨텍스트 사용률 추정 (마지막 턴의 input ~ 누적 input / turns * 가중치)
export function estimateContextUsage(session: Session): number | null {
  const input = session.total_input_tokens;
  const turns = session.num_turns;
  if (input == null || !turns || turns === 0) return null;
  const estimatedLastTurnInput = (input / turns) * Math.min(turns, 3);
  const contextWindow = getContextWindow(session.model);
  return Math.min(Math.round((estimatedLastTurnInput / contextWindow) * 100), 100);
}

// 캐시 히트율
export function getCacheHitRate(session: Session): number | null {
  const input = session.total_input_tokens;
  const cacheRead = session.total_cache_read_tokens;
  if (input == null || cacheRead == null || input === 0) return null;
  return Math.round((cacheRead / (input + cacheRead)) * 100);
}

export function ProgressBar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/40">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function contextBarColor(pct: number): string {
  if (pct >= 85) return "bg-red-500";
  if (pct >= 60) return "bg-amber-500";
  return "bg-emerald-500";
}

function cacheBarColor(pct: number): string {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function SessionEfficiency({ session }: { session: Session }) {
  const contextPct = estimateContextUsage(session);
  const cacheHit = getCacheHitRate(session);
  const turns = session.num_turns;
  const totalTokens = (session.total_input_tokens ?? 0) + (session.total_output_tokens ?? 0);
  const tokensPerTurn = turns && turns > 0 ? Math.round(totalTokens / turns) : null;
  const toolCount = session.tool_count ?? 0;
  const toolsPerTurn = turns && turns > 0 ? Math.round((toolCount / turns) * 10) / 10 : null;

  // 세션 지속 시간
  const durationMin = session.ended_at
    ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60_000)
    : null;

  const hasData = contextPct != null || cacheHit != null || tokensPerTurn != null;
  if (!hasData) return null;

  return (
    <>
      <Separator />
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">세션 효율</h4>
        <div className="space-y-3">
          {/* 컨텍스트 사용률 */}
          {contextPct != null && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">컨텍스트 사용률 (추정)</span>
                <span className={`font-mono font-bold ${contextPct >= 85 ? "text-red-400" : contextPct >= 60 ? "text-amber-400" : "text-emerald-400"}`}>
                  {contextPct}%
                </span>
              </div>
              <ProgressBar value={contextPct} color={contextBarColor(contextPct)} />
              {contextPct >= 85 && (
                <p className="mt-1 text-[10px] text-red-400/80">컨텍스트 윈도우 포화 근접 — compact 발생 가능</p>
              )}
            </div>
          )}

          {/* 캐시 효율 */}
          {cacheHit != null && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">캐시 히트율</span>
                <span className={`font-mono font-bold ${cacheHit >= 70 ? "text-emerald-400" : cacheHit >= 40 ? "text-amber-400" : "text-red-400"}`}>
                  {cacheHit}%
                </span>
              </div>
              <ProgressBar value={cacheHit} color={cacheBarColor(cacheHit)} />
            </div>
          )}

          {/* 효율 지표 그리드 */}
          <div className="grid grid-cols-3 gap-3">
            {tokensPerTurn != null && (
              <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                <div className="text-[10px] uppercase text-muted-foreground">토큰/턴</div>
                <div className="font-mono text-sm font-bold">{formatTokens(tokensPerTurn)}</div>
              </div>
            )}
            {toolsPerTurn != null && (
              <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                <div className="text-[10px] uppercase text-muted-foreground">도구/턴</div>
                <div className="font-mono text-sm font-bold">{toolsPerTurn}</div>
              </div>
            )}
            {durationMin != null && (
              <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                <div className="text-[10px] uppercase text-muted-foreground">소요 시간</div>
                <div className="font-mono text-sm font-bold">{durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin}m`}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
