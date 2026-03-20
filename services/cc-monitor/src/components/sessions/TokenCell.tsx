import { formatTokens } from "@/lib/format";
import type { Session } from "@/lib/types";

function getCacheHitRate(session: Session): number | null {
  const input = session.total_input_tokens;
  const cacheRead = session.total_cache_read_tokens;
  if (input == null || cacheRead == null || input === 0) return null;
  return Math.round((cacheRead / (input + cacheRead)) * 100);
}

export function TokenCell({ session, maxTokens }: { session: Session; maxTokens: number }) {
  const total = (session.total_input_tokens ?? 0) + (session.total_output_tokens ?? 0);
  const pct = maxTokens > 0 ? (total / maxTokens) * 100 : 0;
  const cacheHit = getCacheHitRate(session);

  return (
    <td className="px-4 py-3 text-right">
      <div className="flex flex-col items-end gap-1">
        <span className="font-mono">{formatTokens(total)}</span>
        <div className="flex items-center gap-1.5">
          {cacheHit != null && (
            <span className={`text-[9px] ${cacheHit >= 70 ? "text-emerald-400" : cacheHit >= 40 ? "text-amber-400" : "text-muted-foreground/70"}`}>
              캐시 {cacheHit}%
            </span>
          )}
          <div className="h-1 w-12 rounded-full bg-muted/30">
            <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      </div>
    </td>
  );
}
