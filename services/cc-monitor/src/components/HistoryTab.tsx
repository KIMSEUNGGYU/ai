import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { sessionEventsQueryOptions, sessionsQueryOptions } from "@/lib/query-options";
import { formatTime, formatDate } from "@/lib/format";
import type { StoredEvent, Session } from "@/lib/types";

// ── 프롬프트 턴 (UserPromptSubmit 사이의 이벤트 그룹) ──

interface PromptTurn {
  prompt: string;
  timestamp: string;
  events: StoredEvent[];
  checks: TurnCheck[];
  toolSummary: Map<string, number>;
}

interface TurnCheck {
  label: string;
  status: "pass" | "fail";
  detail: string;
}

function buildTurns(events: StoredEvent[]): PromptTurn[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const turns: PromptTurn[] = [];
  let currentPrompt: string | null = null;
  let currentTimestamp: string | null = null;
  let currentEvents: StoredEvent[] = [];

  for (const ev of sorted) {
    if (ev.event_type === "UserPromptSubmit" && ev.prompt_text) {
      // 이전 턴 저장
      if (currentPrompt !== null && currentTimestamp !== null) {
        turns.push(createTurn(currentPrompt, currentTimestamp, currentEvents));
      }
      currentPrompt = ev.prompt_text;
      currentTimestamp = ev.timestamp;
      currentEvents = [];
    } else if (currentPrompt !== null) {
      currentEvents.push(ev);
    }
  }

  // 마지막 턴
  if (currentPrompt !== null && currentTimestamp !== null) {
    turns.push(createTurn(currentPrompt, currentTimestamp, currentEvents));
  }

  return turns.reverse(); // 최신순
}

function createTurn(prompt: string, timestamp: string, events: StoredEvent[]): PromptTurn {
  const checks = runChecks(events);
  const toolSummary = new Map<string, number>();

  for (const ev of events) {
    if (ev.event_type === "PostToolUse" && ev.tool_name) {
      const name = ev.tool_name;
      toolSummary.set(name, (toolSummary.get(name) ?? 0) + 1);
    }
  }

  return { prompt, timestamp, events, checks, toolSummary };
}

function runChecks(events: StoredEvent[]): TurnCheck[] {
  const checks: TurnCheck[] = [];

  // 1. 컨벤션 주입 체크
  const conventionHooks = events.filter(
    (e) => e.tool_name?.includes("fe-convention-prompt") && e.raw_data,
  );
  if (conventionHooks.length > 0) {
    const allConventions: string[] = [];
    for (const h of conventionHooks) {
      try {
        const data = JSON.parse(h.raw_data!) as { injected_conventions?: string[] };
        allConventions.push(...(data.injected_conventions ?? []));
      } catch { /* skip */ }
    }
    const fileNames = allConventions.filter((c) => c.includes(".")).join(", ");
    checks.push({
      label: "컨벤션 주입",
      status: "pass",
      detail: fileNames || "요약만 출력",
    });
  }

  // 2. Skill 호출 체크
  const skills = events.filter(
    (e) => e.tool_name === "Skill" && e.event_type === "PostToolUse",
  );
  if (skills.length > 0) {
    const names = skills
      .map((e) => e.tool_input_summary?.replace(/^skill:\s*/, "") ?? "unknown")
      .filter((n, i, arr) => arr.indexOf(n) === i);
    checks.push({ label: "Skill", status: "pass", detail: names.join(", ") });
  }

  // 3. Agent 위임 체크
  const agents = events.filter(
    (e) => e.tool_name === "Agent" && e.event_type === "PostToolUse",
  );
  if (agents.length > 0) {
    const descriptions = agents
      .map((e) => e.tool_input_summary ?? "")
      .filter(Boolean)
      .slice(0, 3);
    checks.push({
      label: "Agent",
      status: "pass",
      detail: `${agents.length}회${descriptions.length > 0 ? ` — ${descriptions[0]}` : ""}`,
    });
  }

  // 4. post-edit-convention 체크
  const postEdit = events.filter(
    (e) => e.tool_name?.includes("post-edit-convention"),
  );
  if (postEdit.length > 0) {
    checks.push({
      label: "post-edit 체크",
      status: "pass",
      detail: `${postEdit.length}회 발동`,
    });
  }

  return checks;
}

// ── 컴포넌트 ──

export function HistoryTab() {
  const { data: sessions } = useQuery(sessionsQueryOptions());
  const recentSessions = useMemo(
    () => (sessions ?? []).slice(0, 20),
    [sessions],
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const { data: events, isLoading } = useQuery({
    ...sessionEventsQueryOptions(selectedSessionId),
    enabled: !!selectedSessionId,
  });

  const turns = useMemo(
    () => (events ? buildTurns(events) : []),
    [events],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 세션 선택 */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Session
        </label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="h-8 min-w-[300px] rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">세션 선택...</option>
          {recentSessions.map((s) => (
            <option key={s.session_id} value={s.session_id}>
              {formatSessionLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {/* 로딩 */}
      {isLoading && selectedSessionId && (
        <p className="text-xs text-muted-foreground">로딩 중...</p>
      )}

      {/* 프롬프트 없음 */}
      {selectedSessionId && !isLoading && turns.length === 0 && (
        <p className="text-xs text-muted-foreground">프롬프트 이벤트가 없습니다.</p>
      )}

      {/* 프롬프트 타임라인 */}
      {turns.length > 0 && (
        <div className="space-y-2">
          {turns.map((turn, i) => (
            <TurnCard key={i} turn={turn} />
          ))}
        </div>
      )}
    </div>
  );
}

function TurnCard({ turn }: { turn: PromptTurn }) {
  const [expanded, setExpanded] = useState(false);
  const toolEntries = [...turn.toolSummary.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-lg border border-border/60 bg-card/50">
      {/* 헤더 */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/80 font-mono w-14">
          {formatTime(turn.timestamp)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2">
            {turn.prompt}
          </p>

          {/* 체크 결과 */}
          {turn.checks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {turn.checks.map((c, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`text-[10px] ${
                    c.status === "pass"
                      ? "border-emerald-500/40 text-emerald-400"
                      : "border-red-500/40 text-red-400"
                  }`}
                >
                  {c.status === "pass" ? "✓" : "✗"} {c.label}: {c.detail}
                </Badge>
              ))}
            </div>
          )}

          {/* 도구 요약 */}
          {toolEntries.length > 0 && (
            <div className="mt-1.5 text-[11px] text-muted-foreground/60">
              → {toolEntries.map(([name, count]) => `${name} ${count}회`).join(", ")}
            </div>
          )}
        </div>
        <span className="mt-1 shrink-0 text-[10px] text-muted-foreground/40">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* 상세 이벤트 */}
      {expanded && (
        <div className="border-t border-border/30 px-4 py-2 space-y-1">
          {turn.events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-2 text-[11px]">
              <span className="w-14 shrink-0 text-muted-foreground/60 font-mono">
                {formatTime(ev.timestamp)}
              </span>
              <span className="shrink-0 font-medium text-foreground/70">
                {ev.tool_name ?? ev.event_type}
              </span>
              {ev.tool_input_summary && (
                <span className="truncate text-muted-foreground/50">
                  {ev.tool_input_summary}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSessionLabel(s: Session): string {
  const id = s.session_id.slice(0, 8);
  const project = s.project_path.split("/").pop() ?? "";
  const date = formatDate(s.started_at);
  const task = s.task_name ? ` [${s.task_name}]` : "";
  return `${id} — ${project}${task} (${date})`;
}
