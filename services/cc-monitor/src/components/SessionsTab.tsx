import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

function formatDate(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `오늘 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

function eventTypeColor(type: string): "default" | "secondary" | "destructive" | "outline" {
  if (type === "UserPromptSubmit") return "default";
  if (type === "Stop" || type === "SessionEnd") return "destructive";
  if (type.startsWith("Post")) return "secondary";
  return "outline";
}

// 모델별 컨텍스트 윈도우 크기 (토큰)
function getContextWindow(model: string | null): number {
  if (!model) return 200_000;
  if (model.includes("opus")) return 200_000;
  if (model.includes("sonnet")) return 200_000;
  if (model.includes("haiku")) return 200_000;
  return 200_000;
}

// 컨텍스트 사용률 추정 (마지막 턴의 input ≈ 누적 input / turns * 가중치)
function estimateContextUsage(session: Session): number | null {
  const input = session.total_input_tokens;
  const turns = session.num_turns;
  if (input == null || !turns || turns === 0) return null;
  // 마지막 턴의 input tokens ≈ total / turns * 1.5 (컨텍스트 누적 효과)
  // 더 정확하게: 마지막 턴은 전체 컨텍스트를 포함하므로 total_input / turns 의 약 2배
  const estimatedLastTurnInput = (input / turns) * Math.min(turns, 3);
  const contextWindow = getContextWindow(session.model);
  return Math.min(Math.round((estimatedLastTurnInput / contextWindow) * 100), 100);
}

// 캐시 히트율
function getCacheHitRate(session: Session): number | null {
  const input = session.total_input_tokens;
  const cacheRead = session.total_cache_read_tokens;
  if (input == null || cacheRead == null || input === 0) return null;
  return Math.round((cacheRead / (input + cacheRead)) * 100);
}

function ProgressBar({ value, color = "bg-primary" }: { value: number; color?: string }) {
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

function SessionEfficiency({ session }: { session: Session }) {
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

function SessionDrawer({ session, events, isLoading, onClose }: {
  session: Session;
  events: StoredEvent[];
  isLoading: boolean;
  onClose: () => void;
}) {
  // tool_summary(경량 카운터) + events(개별 이벤트)에서 도구 카운트 합산
  const lightToolCounts = parseToolSummary(session.tool_summary);
  const eventToolCounts: Record<string, number> = {};
  for (const ev of events) {
    if (ev.tool_name && ev.event_type === "PostToolUse") {
      eventToolCounts[ev.tool_name] = (eventToolCounts[ev.tool_name] ?? 0) + 1;
    }
  }
  const toolSummary = { ...eventToolCounts, ...lightToolCounts };
  const prompts = events.filter((e) => e.event_type === "UserPromptSubmit");

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      {/* drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[55%] min-w-[400px] max-w-[800px] flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-200">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Badge variant={session.status === "active" ? "default" : "secondary"} className="text-[10px]">
              {session.status === "active" ? "Active" : "Ended"}
            </Badge>
            <span className="font-mono text-sm font-semibold">{session.user_id}</span>
            <span className="text-xs text-muted-foreground">{shortPath(session.project_path)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
            ✕
          </Button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            {/* 세션 메타 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="text-muted-foreground">모델</div>
              <div className="font-mono">{session.model ?? "-"}</div>
              <div className="text-muted-foreground">시작</div>
              <div className="font-mono">{new Date(session.started_at).toLocaleString()}</div>
              {session.ended_at && (
                <>
                  <div className="text-muted-foreground">종료</div>
                  <div className="font-mono">{new Date(session.ended_at).toLocaleString()}</div>
                </>
              )}
              <div className="text-muted-foreground">권한 모드</div>
              <div className="font-mono">{session.permission_mode ?? "-"}</div>
            </div>

            <Separator />

            {/* 토큰 */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">토큰 사용량</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Input", value: session.total_input_tokens },
                  { label: "Output", value: session.total_output_tokens },
                  { label: "Cache Write", value: session.total_cache_create_tokens },
                  { label: "Cache Read", value: session.total_cache_read_tokens },
                  { label: "Turns", value: session.num_turns },
                  { label: "Events", value: session.event_count },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                    <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
                    <div className="font-mono text-sm font-bold">{formatTokens(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 세션 효율 */}
            <SessionEfficiency session={session} />

            {/* 도구 요약 */}
            {Object.keys(toolSummary).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">도구 사용</h4>
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
              </>
            )}

            {/* 프롬프트 */}
            {prompts.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    프롬프트 ({prompts.length})
                  </h4>
                  <div className="space-y-2">
                    {prompts.map((ev) => (
                      <div key={ev.id} className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
                        <div className="mb-1 text-[10px] text-muted-foreground/60">{formatTime(ev.timestamp)}</div>
                        <div className="whitespace-pre-wrap font-mono text-xs text-foreground/90 leading-relaxed">
                          {ev.prompt_text ?? ev.tool_input_summary ?? "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 이벤트 타임라인 */}
            <Separator />
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                이벤트 타임라인{" "}
                {isLoading && <span className="animate-pulse">불러오는 중…</span>}
                {!isLoading && events.length > 0 && `(${events.length})`}
              </h4>
              {events.length === 0 && !isLoading && (
                <p className="text-xs text-muted-foreground/60">이벤트 없음</p>
              )}
              {events.length > 0 && (
                <div className="space-y-0.5 rounded border border-border/50 bg-background/50 p-2">
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
        </div>
      </div>
    </>
  );
}

// 세션 목록의 토큰 컬럼에 미니 프로그레스바 표시
function TokenCell({ session, maxTokens }: { session: Session; maxTokens: number }) {
  const total = (session.total_input_tokens ?? 0) + (session.total_output_tokens ?? 0);
  const pct = maxTokens > 0 ? (total / maxTokens) * 100 : 0;
  const cacheHit = getCacheHitRate(session);

  return (
    <td className="px-4 py-3 text-right">
      <div className="flex flex-col items-end gap-1">
        <span className="font-mono">{formatTokens(total)}</span>
        <div className="flex items-center gap-1.5">
          {cacheHit != null && (
            <span className={`text-[9px] ${cacheHit >= 70 ? "text-emerald-400" : cacheHit >= 40 ? "text-amber-400" : "text-muted-foreground/50"}`}>
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

export function SessionsTab({ sessions, events, initialExpandedId }: SessionsTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialExpandedId ?? null);
  const [sessionEvents, setSessionEvents] = useState<Record<string, StoredEvent[]>>({});
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null);

  useEffect(function syncInitialExpanded() {
    if (initialExpandedId) {
      setSelectedId(initialExpandedId);
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

  function handleSelect(sessionId: string) {
    if (selectedId === sessionId) {
      setSelectedId(null);
    } else {
      setSelectedId(sessionId);
      fetchSessionEvents(sessionId);
    }
  }

  useEffect(function fetchOnInitialExpand() {
    if (selectedId && !sessionEvents[selectedId]) {
      fetchSessionEvents(selectedId);
    }
  }, [selectedId, sessionEvents, fetchSessionEvents]);

  // Esc 키로 drawer 닫기
  useEffect(function handleEscKey() {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    if (selectedId) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [selectedId]);

  // active 먼저, 최신 활동(ended_at or started_at) 기준 내림차순
  const sorted = [...sessions].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    const aTime = new Date(a.last_event_at ?? a.ended_at ?? a.started_at).getTime();
    const bTime = new Date(b.last_event_at ?? b.ended_at ?? b.started_at).getTime();
    return bTime - aTime;
  });

  // 토큰 바 상대 비교용 최대값
  const maxTokens = Math.max(...sessions.map((s) => (s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0)), 1);

  const selectedSession = selectedId ? sessions.find((s) => s.session_id === selectedId) : null;

  return (
    <>
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="!p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">프로젝트</th>
                  <th className="px-4 py-3">모델</th>
                  <th className="px-4 py-3">시작</th>
                  <th className="px-4 py-3">최신 활동</th>
                  <th className="px-4 py-3 text-right">이벤트</th>
                  <th className="px-4 py-3 text-right">토큰</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr
                    key={s.session_id}
                    onClick={() => handleSelect(s.session_id)}
                    className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30 ${
                      selectedId === s.session_id ? "bg-muted/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {s.status === "active" ? "Active" : "Ended"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{shortPath(s.project_path)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.model ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(s.started_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(s.last_event_at ?? s.ended_at ?? s.started_at)}
                    </td>
                    <td className="px-4 py-3 text-right">{s.event_count}</td>
                    <TokenCell session={s} maxTokens={maxTokens} />
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {selectedSession && (
        <SessionDrawer
          session={selectedSession}
          events={sessionEvents[selectedId!] ?? []}
          isLoading={loadingEvents === selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
