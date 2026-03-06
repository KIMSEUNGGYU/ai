import type { StoredEvent } from "@/lib/types";

interface ActivityFeedProps {
  events: StoredEvent[];
}

const EVENT_DOT_COLORS: Record<string, string> = {
  SessionStart: "bg-green-400",
  SessionEnd: "bg-red-400",
  PreToolUse: "bg-blue-400",
  PostToolUse: "bg-blue-400",
  UserPromptSubmit: "bg-purple-300",
  Stop: "bg-red-400",
};

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <section>
      <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground mb-3">
        ACTIVITY FEED
      </h2>
      <div className="flex flex-col gap-1.5 max-h-[600px] overflow-auto">
        {events.length === 0 && (
          <p className="text-muted-foreground/60 italic text-[13px]">
            이벤트 없음
          </p>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-2.5 text-xs py-1 border-b border-border"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${EVENT_DOT_COLORS[e.event_type] ?? "bg-muted-foreground/60"}`}
            />
            <span className="text-blue-400 min-w-[100px] font-medium">
              {e.user_id}
            </span>
            <span className="flex-1 text-foreground whitespace-nowrap">
              {formatEventType(e)}
            </span>
            {e.tool_duration_ms != null && (
              <span className="text-yellow-500 text-[10px] shrink-0 px-1 py-px bg-yellow-900/30 rounded-sm">
                {formatMs(e.tool_duration_ms)}
              </span>
            )}
            <span className="text-muted-foreground/60 text-[11px] shrink-0">
              {new Date(e.timestamp).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatEventType(e: StoredEvent): string {
  if (e.tool_name) {
    const summary = e.tool_input_summary ? `: ${e.tool_input_summary}` : "";
    return `${e.event_type} → ${e.tool_name}${summary}`;
  }
  if (e.event_type === "SessionStart") return "Session started";
  if (e.event_type === "SessionEnd") return "Session ended";
  if (e.event_type === "UserPromptSubmit") return "Prompt submitted";
  if (e.event_type === "Stop") return "Stopped";
  return e.event_type;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
