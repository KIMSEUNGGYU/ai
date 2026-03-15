import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { getToolCategory, CATEGORY_COLORS } from "@/lib/tool-categories";
import { getToolDescription } from "@/lib/tool-descriptions";
import { formatTime } from "@/lib/format";
import type { StoredEvent } from "@/lib/types";

interface EventTimelineProps {
  events: StoredEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="space-y-0.5 rounded border border-border/50 bg-background/50 p-2">
      {events.map((ev) => {
        const isExpanded = expandedId === ev.id;
        const hasDetail = Boolean(ev.tool_input_summary || ev.raw_data);

        return (
          <div key={ev.id}>
            <div
              className={`flex items-center gap-2 text-xs ${hasDetail ? "cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1" : ""}`}
              onClick={() => hasDetail && setExpandedId(isExpanded ? null : (ev.id ?? null))}
            >
              <span className="w-16 shrink-0 text-muted-foreground/80">{formatTime(ev.timestamp)}</span>
              <span className={`inline-flex shrink-0 rounded border px-1 py-0.5 text-[10px] font-medium ${
                CATEGORY_COLORS[getToolCategory(ev.tool_name, ev.event_type)]
              }`}>
                {ev.tool_name ?? ev.event_type}
              </span>
              {ev.tool_name && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help font-mono text-foreground/90 underline decoration-dotted underline-offset-2">
                      {ev.tool_name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {getToolDescription(ev.tool_name)}
                  </TooltipContent>
                </Tooltip>
              )}
              {ev.tool_duration_ms != null && (
                <span className="text-muted-foreground/70">{ev.tool_duration_ms}ms</span>
              )}
              {ev.tool_input_summary && (
                <span className={`text-muted-foreground/70 ${isExpanded ? "hidden" : "truncate"}`}>
                  {ev.tool_input_summary}
                </span>
              )}
              {hasDetail && (
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/50">
                  {isExpanded ? "▲" : "▼"}
                </span>
              )}
            </div>
            {isExpanded && (
              <div className="ml-[4.5rem] mt-1 mb-2 rounded border border-border/30 bg-muted/10 px-3 py-2">
                {ev.tool_input_summary && (
                  <div className="whitespace-pre-wrap font-mono text-[11px] text-foreground/80 leading-relaxed">
                    {ev.tool_input_summary}
                  </div>
                )}
                {ev.raw_data && (
                  <div className="mt-2 border-t border-border/20 pt-2">
                    <div className="text-[10px] uppercase text-muted-foreground/50 mb-1">raw data</div>
                    <pre className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
                      {formatRawData(ev.raw_data)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatRawData(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
