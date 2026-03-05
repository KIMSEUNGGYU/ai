import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Session, StoredEvent } from "@/lib/types";

interface SessionsTabProps {
  sessions: Session[];
  events: StoredEvent[];
  initialExpandedId?: string | null;
}

function parseToolSummary(json: string | null | undefined): Record<string, number> {
  if (!json) return {};
  try { return JSON.parse(json); } catch { return {}; }
}

function shortPath(fullPath: string): string {
  const parts = fullPath.split("/").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : fullPath;
}

function formatTokens(n: number | null | undefined): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function eventTypeColor(type: string): "default" | "secondary" | "destructive" | "outline" {
  if (type === "UserPromptSubmit") return "default";
  if (type === "Stop" || type === "SessionEnd") return "destructive";
  if (type.startsWith("Post")) return "secondary";
  return "outline";
}

function SessionDetail({ session, events, isLoading, toolSummary }: {
  session: Session;
  events: StoredEvent[];
  isLoading: boolean;
  toolSummary: Record<string, number>;
}) {
  const prompts = events.filter((e) => e.event_type === "UserPromptSubmit");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 토큰 요약 */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">토큰 사용량</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Input: <span className="font-mono font-bold">{formatTokens(session.total_input_tokens)}</span></div>
          <div>Output: <span className="font-mono font-bold">{formatTokens(session.total_output_tokens)}</span></div>
          <div>Cache Write: <span className="font-mono font-bold">{formatTokens(session.total_cache_create_tokens)}</span></div>
          <div>Cache Read: <span className="font-mono font-bold">{formatTokens(session.total_cache_read_tokens)}</span></div>
          <div>Turns: <span className="font-mono font-bold">{session.num_turns ?? "-"}</span></div>
        </div>
      </div>

      {/* 도구 요약 */}
      {Object.keys(toolSummary).length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">도구 사용</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(toolSummary)
              .sort((a, b) => b[1] - a[1])
              .map(([tool, count]) => (
                <Badge key={tool} variant="outline" className="text-xs">
                  {tool}: {count}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* 프롬프트 목록 */}
      {prompts.length > 0 && (
        <div className="lg:col-span-2">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            프롬프트 ({prompts.length})
          </h4>
          <div className="space-y-1">
            {prompts.map((ev) => (
              <div key={ev.id} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 text-muted-foreground/60">{formatTime(ev.timestamp)}</span>
                <span className="font-mono text-foreground/90">
                  {ev.prompt_text
                    ? ev.prompt_text.length > 120 ? ev.prompt_text.slice(0, 120) + "…" : ev.prompt_text
                    : ev.tool_input_summary ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이벤트 타임라인 */}
      <div className="lg:col-span-2">
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          이벤트 타임라인 {isLoading && <span className="animate-pulse">불러오는 중…</span>}
          {!isLoading && events.length > 0 && `(${events.length})`}
        </h4>
        {events.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground/60">이벤트 없음</p>
        )}
        {events.length > 0 && (
          <div className="max-h-64 space-y-0.5 overflow-y-auto rounded border border-border/50 bg-background/50 p-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0 text-muted-foreground/60">{formatTime(ev.timestamp)}</span>
                <Badge variant={eventTypeColor(ev.event_type)} className="text-[10px]">
                  {ev.event_type}
                </Badge>
                {ev.tool_name && <span className="font-mono text-foreground/80">{ev.tool_name}</span>}
                {ev.tool_duration_ms != null && (
                  <span className="text-muted-foreground/50">{ev.tool_duration_ms}ms</span>
                )}
                {ev.tool_input_summary && (
                  <span className="truncate text-muted-foreground/50">{ev.tool_input_summary}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SessionsTab({ sessions, events, initialExpandedId }: SessionsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId ?? null);
  const [sessionEvents, setSessionEvents] = useState<Record<string, StoredEvent[]>>({});
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null);

  useEffect(function syncInitialExpanded() {
    if (initialExpandedId) {
      setExpandedId(initialExpandedId);
    }
  }, [initialExpandedId]);

  const fetchSessionEvents = useCallback(async (sessionId: string) => {
    if (sessionEvents[sessionId]) return;
    setLoadingEvents(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/events`);
      const data = await res.json();
      setSessionEvents((prev) => ({ ...prev, [sessionId]: data.events as StoredEvent[] }));
    } catch {
      const fallback = events.filter((e) => e.session_id === sessionId);
      setSessionEvents((prev) => ({ ...prev, [sessionId]: fallback }));
    } finally {
      setLoadingEvents(null);
    }
  }, [sessionEvents, events]);

  function handleToggle(sessionId: string) {
    if (expandedId === sessionId) {
      setExpandedId(null);
    } else {
      setExpandedId(sessionId);
      fetchSessionEvents(sessionId);
    }
  }

  useEffect(function fetchOnInitialExpand() {
    if (expandedId && !sessionEvents[expandedId]) {
      fetchSessionEvents(expandedId);
    }
  }, [expandedId, sessionEvents, fetchSessionEvents]);

  const sorted = [...sessions].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="!p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">사용자</th>
                <th className="px-4 py-3">프로젝트</th>
                <th className="px-4 py-3">모델</th>
                <th className="px-4 py-3">시작</th>
                <th className="px-4 py-3 text-right">이벤트</th>
                <th className="px-4 py-3 text-right">토큰</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const isExpanded = expandedId === s.session_id;
                const evts = sessionEvents[s.session_id] ?? [];
                const isLoading = loadingEvents === s.session_id;
                const toolSummary = parseToolSummary((s as unknown as Record<string, unknown>).tool_summary as string | null);

                return (
                  <>
                    <tr
                      key={s.session_id}
                      onClick={() => handleToggle(s.session_id)}
                      className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {s.status === "active" ? "Active" : "Ended"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{s.user_id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{shortPath(s.project_path)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.model ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.started_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-right">{s.event_count}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatTokens((s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0))}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${s.session_id}-detail`}>
                        <td colSpan={7} className="bg-muted/20 px-4 py-4">
                          <SessionDetail
                            session={s}
                            events={evts}
                            isLoading={isLoading}
                            toolSummary={toolSummary}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
