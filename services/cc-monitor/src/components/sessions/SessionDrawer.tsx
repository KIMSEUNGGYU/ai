import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getToolCategory, CATEGORY_COLORS, ALL_CATEGORIES, type ToolCategory } from "@/lib/tool-categories";
import { formatTokens, formatTime, shortPath } from "@/lib/format";
import { EventTimeline } from "./EventTimeline";
import { sessionEventsQueryOptions } from "@/lib/query-options";
import { SessionEfficiency } from "@/components/sessions/SessionEfficiency";
import { PluginHealth } from "@/components/sessions/PluginHealth";
import type { Session, StoredEvent } from "@/lib/types";

function parseToolSummary(json: string | null | undefined): Record<string, number> {
  if (!json) return {};
  try { return JSON.parse(json); } catch { return {}; }
}

interface SessionDrawerProps {
  session: Session;
  fallbackEvents: StoredEvent[];
  onClose: () => void;
}

const PROMPT_PASSWORD = "gyu-test";
const PROMPT_STORAGE_KEY = "cc-monitor-prompt-unlocked";

function usePromptAuth() {
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(PROMPT_STORAGE_KEY) === "true";
  });
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function tryUnlock() {
    if (input === PROMPT_PASSWORD) {
      setUnlocked(true);
      sessionStorage.setItem(PROMPT_STORAGE_KEY, "true");
      setError(false);
    } else {
      setError(true);
    }
  }

  function lock() {
    setUnlocked(false);
    setInput("");
    sessionStorage.removeItem(PROMPT_STORAGE_KEY);
  }

  return { unlocked, input, setInput, error, tryUnlock, lock };
}

export function SessionDrawer({ session, fallbackEvents, onClose }: SessionDrawerProps) {
  const { data: fetchedEvents, isLoading } = useQuery(sessionEventsQueryOptions(session.session_id));
  const events = fetchedEvents ?? fallbackEvents;

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

  const promptAuth = usePromptAuth();

  // 필터링 상태: 빈 Set = 전체 표시, 선택하면 해당 카테고리만 표시
  const [selectedCategories, setSelectedCategories] = useState<Set<ToolCategory>>(new Set());

  const toggleCategory = (cat: ToolCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const resetFilter = () => setSelectedCategories(new Set());
  const isFiltering = selectedCategories.size > 0;

  const categoryCounts = useMemo(function computeCategoryCounts() {
    const counts: Record<string, number> = {};
    for (const ev of events) {
      const cat = getToolCategory(ev.tool_name, ev.event_type);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  const filteredEvents = useMemo(function filterEvents() {
    return isFiltering
      ? events.filter((ev) => selectedCategories.has(getToolCategory(ev.tool_name, ev.event_type)))
      : events;
  }, [events, selectedCategories, isFiltering]);

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      {/* drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[70%] min-w-[500px] max-w-[1100px] flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-200">
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

            {/* Plugin Health */}
            {events.length > 0 && (
              <>
                <Separator />
                <PluginHealth events={events} />
              </>
            )}

            {/* 프롬프트 */}
            {prompts.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      프롬프트 ({prompts.length})
                    </h4>
                    {promptAuth.unlocked && (
                      <button
                        onClick={promptAuth.lock}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        숨기기
                      </button>
                    )}
                  </div>
                  {promptAuth.unlocked ? (
                    <div className="space-y-2">
                      {prompts.map((ev) => (
                        <div key={ev.id} className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
                          <div className="mb-1 text-[10px] text-muted-foreground/80">{formatTime(ev.timestamp)}</div>
                          <div className="whitespace-pre-wrap font-mono text-xs text-foreground/90 leading-relaxed">
                            {ev.prompt_text ?? ev.tool_input_summary ?? "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="비밀번호 입력"
                        value={promptAuth.input}
                        onChange={(e) => promptAuth.setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && promptAuth.tryUnlock()}
                        className={`h-8 rounded-md border bg-background px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring ${
                          promptAuth.error ? "border-red-500" : "border-border"
                        }`}
                      />
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={promptAuth.tryUnlock}>
                        확인
                      </Button>
                      {promptAuth.error && (
                        <span className="text-xs text-red-500">비밀번호가 틀렸습니다</span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 이벤트 타임라인 */}
            <Separator />
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                이벤트 타임라인{" "}
                {isLoading && <span className="animate-pulse">불러오는 중…</span>}
                {!isLoading && events.length > 0 && `(${filteredEvents.length}/${events.length})`}
              </h4>

              {/* 필터 배지 */}
              {events.length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <button
                    onClick={resetFilter}
                    disabled={!isFiltering}
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      isFiltering
                        ? "text-muted-foreground hover:bg-accent cursor-pointer"
                        : "text-muted-foreground/40 cursor-default"
                    }`}
                  >
                    Reset
                  </button>
                  <span className="mx-1 h-3 w-px bg-border" />
                  {ALL_CATEGORIES.map((cat) => {
                    const isActive = selectedCategories.has(cat);
                    const count = categoryCounts[cat];
                    if (!count) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                          isActive ? CATEGORY_COLORS[cat] : "border-border text-muted-foreground bg-muted/30"
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {events.length === 0 && !isLoading && (
                <p className="text-xs text-muted-foreground/80">이벤트 없음</p>
              )}
              {filteredEvents.length > 0 && (
                <EventTimeline events={filteredEvents} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
