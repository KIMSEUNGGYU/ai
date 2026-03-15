import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenCell } from "@/components/sessions/TokenCell";
import { sessionEventsQueryOptions, sessionsQueryOptions } from "@/lib/query-options";
import { formatTime, formatDate, formatTokens, shortPath } from "@/lib/format";
import type { StoredEvent, Session } from "@/lib/types";

// ── 프롬프트 턴 ──

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

  if (currentPrompt !== null && currentTimestamp !== null) {
    turns.push(createTurn(currentPrompt, currentTimestamp, currentEvents));
  }

  return turns.reverse();
}

function createTurn(prompt: string, timestamp: string, events: StoredEvent[]): PromptTurn {
  const checks = runChecks(events);
  const toolSummary = new Map<string, number>();

  for (const ev of events) {
    if (ev.event_type === "PostToolUse" && ev.tool_name) {
      toolSummary.set(ev.tool_name, (toolSummary.get(ev.tool_name) ?? 0) + 1);
    }
  }

  return { prompt, timestamp, events, checks, toolSummary };
}

function runChecks(events: StoredEvent[]): TurnCheck[] {
  const checks: TurnCheck[] = [];

  const conventionHooks = events.filter(
    (e) => e.tool_name?.includes("fe-convention-prompt") && e.raw_data,
  );
  if (conventionHooks.length > 0) {
    const allConventions: string[] = [];
    let totalBytes = 0;
    let lastHash: string | null = null;
    for (const h of conventionHooks) {
      try {
        const data = JSON.parse(h.raw_data!) as {
          injected_conventions?: string[];
          injection_total_bytes?: number;
          injection_hash?: string;
        };
        allConventions.push(...(data.injected_conventions ?? []));
        totalBytes += data.injection_total_bytes ?? 0;
        if (data.injection_hash) lastHash = data.injection_hash;
      } catch { /* skip */ }
    }
    const fileNames = allConventions.filter((c) => c.includes(".")).join(", ");
    const bytesLabel = totalBytes > 0 ? ` (${(totalBytes / 1024).toFixed(1)}KB)` : "";
    const hashLabel = lastHash ? ` #${lastHash.slice(0, 8)}` : "";
    checks.push({
      label: "컨벤션 주입",
      status: "pass",
      detail: (fileNames || "요약만 출력") + bytesLabel + hashLabel,
    });
  }

  const skills = events.filter(
    (e) => e.tool_name === "Skill" && e.event_type === "PostToolUse",
  );
  if (skills.length > 0) {
    const names = skills
      .map((e) => e.tool_input_summary?.replace(/^skill:\s*/, "") ?? "unknown")
      .filter((n, i, arr) => arr.indexOf(n) === i);
    checks.push({ label: "Skill", status: "pass", detail: names.join(", ") });
  }

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

// ── 세션 그룹핑 (SessionsTab 동일 로직) ──

interface SessionGroup {
  groupName: string;
  sessions: Session[];
  totalEvents: number;
  totalTokens: number;
  hasActive: boolean;
  latestActivity: string;
}

function getTokenTotal(s: Session): number {
  return (s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0);
}

function extractProjectName(projectPath: string): string {
  if (!projectPath) return "__ungrouped__";
  const cleaned = projectPath.replace(/^~\/|\/$/g, "");
  return cleaned.split("/").pop() ?? "__ungrouped__";
}

function buildGroups(sessions: Session[]): SessionGroup[] {
  const map = new Map<string, Session[]>();

  for (const s of sessions) {
    const key = s.task_name ?? extractProjectName(s.project_path);
    const list = map.get(key);
    if (list) list.push(s);
    else map.set(key, [s]);
  }

  const groups: SessionGroup[] = [];
  for (const [key, list] of map) {
    const totalEvents = list.reduce((sum, s) => sum + s.event_count, 0);
    const totalTokens = list.reduce((sum, s) => sum + getTokenTotal(s), 0);
    const hasActive = list.some((s) => s.status === "active");
    const latestActivity = list.reduce((latest, s) => {
      const t = s.last_event_at ?? s.ended_at ?? s.started_at;
      return t > latest ? t : latest;
    }, "");
    groups.push({ groupName: key, sessions: list, totalEvents, totalTokens, hasActive, latestActivity });
  }

  groups.sort((a, b) => {
    if (a.hasActive !== b.hasActive) return a.hasActive ? -1 : 1;
    return b.latestActivity.localeCompare(a.latestActivity);
  });

  return groups;
}

// ── 컴포넌트 ──

export function HistoryTab() {
  const { data: sessions } = useQuery(sessionsQueryOptions());
  const recentSessions = useMemo(() => (sessions ?? []).slice(0, 50), [sessions]);
  const groups = useMemo(() => buildGroups(recentSessions), [recentSessions]);
  const maxTokens = Math.max(...recentSessions.map(getTokenTotal), 1);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const selectedSession = selectedSessionId
    ? recentSessions.find((s) => s.session_id === selectedSessionId) ?? null
    : null;

  useEffect(function handleEscKey() {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedSessionId("");
    }
    if (selectedSessionId) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [selectedSessionId]);

  function toggleGroup(name: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* 세션 그룹 테이블 */}
        <Card>
          <CardContent className="!p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 w-8" />
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
                {groups.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.groupName);
                  const displayName = group.groupName === "__ungrouped__" ? "미분류" : group.groupName;
                  const sorted = [...group.sessions].sort(
                    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
                  );

                  if (group.sessions.length === 1) {
                    const s = group.sessions[0];
                    return (
                      <SessionRow
                        key={s.session_id}
                        session={s}
                        isSelected={selectedSessionId === s.session_id}
                        maxTokens={maxTokens}
                        onSelect={() => setSelectedSessionId(s.session_id)}
                        indent={false}
                        groupLabel={displayName !== "미분류" ? displayName : undefined}
                      />
                    );
                  }

                  return (
                    <GroupRows
                      key={group.groupName}
                      group={group}
                      displayName={displayName}
                      isCollapsed={isCollapsed}
                      sortedSessions={sorted}
                      selectedSessionId={selectedSessionId}
                      maxTokens={maxTokens}
                      onToggle={() => toggleGroup(group.groupName)}
                      onSelect={setSelectedSessionId}
                    />
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* History 드로어 */}
      {selectedSession && (
        <HistoryDrawer
          session={selectedSession}
          onClose={() => setSelectedSessionId("")}
        />
      )}
    </>
  );
}

// ── History 드로어 ──

function HistoryDrawer({ session, onClose }: { session: Session; onClose: () => void }) {
  const { data: events, isLoading } = useQuery({
    ...sessionEventsQueryOptions(session.session_id),
    enabled: true,
  });

  const turns = useMemo(() => (events ? buildTurns(events) : []), [events]);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* 드로어 패널 */}
      <div className="relative ml-auto h-full w-[70vw] max-w-5xl overflow-y-auto border-l border-border bg-background shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">History</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {session.session_id.slice(0, 8)}
            </span>
            <Badge variant={session.status === "active" ? "default" : "secondary"} className="text-[10px]">
              {session.status === "active" ? "Active" : "Ended"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {shortPath(session.project_path)} · {formatDate(session.started_at)}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-3">
          {isLoading && (
            <p className="text-xs text-muted-foreground">로딩 중...</p>
          )}

          {!isLoading && turns.length === 0 && (
            <p className="text-xs text-muted-foreground">프롬프트 이벤트가 없습니다.</p>
          )}

          {turns.map((turn, i) => (
            <TurnCard key={i} turn={turn} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 그룹 행 ──

interface GroupRowsProps {
  group: SessionGroup;
  displayName: string;
  isCollapsed: boolean;
  sortedSessions: Session[];
  selectedSessionId: string;
  maxTokens: number;
  onToggle: () => void;
  onSelect: (id: string) => void;
}

function GroupRows({ group, displayName, isCollapsed, sortedSessions, selectedSessionId, maxTokens, onToggle, onSelect }: GroupRowsProps) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
      >
        <td className="px-4 py-2.5 text-muted-foreground">
          <span className="text-xs">{isCollapsed ? "▶" : "▼"}</span>
        </td>
        <td colSpan={2} className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{displayName}</span>
            <Badge variant="outline" className="text-[10px]">
              {group.sessions.length}개 세션
            </Badge>
            {group.hasActive && (
              <Badge variant="default" className="text-[10px]">Active</Badge>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5" />
        <td className="px-4 py-2.5" />
        <td className="px-4 py-2.5 text-muted-foreground text-xs">
          {formatDate(group.latestActivity)}
        </td>
        <td className="px-4 py-2.5 text-right text-muted-foreground">
          {group.totalEvents}
        </td>
        <td className="px-4 py-2.5 text-right text-muted-foreground font-mono">
          {formatTokens(group.totalTokens)}
        </td>
      </tr>
      {!isCollapsed &&
        sortedSessions.map((s) => (
          <SessionRow
            key={s.session_id}
            session={s}
            isSelected={selectedSessionId === s.session_id}
            maxTokens={maxTokens}
            onSelect={() => onSelect(s.session_id)}
            indent={true}
          />
        ))}
    </>
  );
}

// ── 세션 행 ──

interface SessionRowProps {
  session: Session;
  isSelected: boolean;
  maxTokens: number;
  onSelect: () => void;
  indent: boolean;
  groupLabel?: string;
}

function SessionRow({ session: s, isSelected, maxTokens, onSelect, indent, groupLabel }: SessionRowProps) {
  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30 ${
        isSelected ? "bg-primary/10 border-primary/30" : ""
      }`}
    >
      <td className="px-4 py-3">
        {indent && <span className="text-muted-foreground/30 text-xs">└</span>}
      </td>
      <td className="px-4 py-3">
        <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">
          {s.status === "active" ? "Active" : "Ended"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="text-muted-foreground">{shortPath(s.project_path)}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground/50">{s.session_id.slice(0, 8)}</span>
          {groupLabel && (
            <Badge variant="outline" className="text-[9px] text-muted-foreground/60">{groupLabel}</Badge>
          )}
        </div>
      </td>
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
  );
}

// ── 턴 카드 ──

function TurnCard({ turn }: { turn: PromptTurn }) {
  const [expanded, setExpanded] = useState(false);
  const toolEntries = [...turn.toolSummary.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-lg border border-border/60 bg-card/50">
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
