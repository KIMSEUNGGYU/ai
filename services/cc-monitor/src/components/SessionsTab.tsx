import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTokens, shortPath } from "@/lib/format";
import { SessionDrawer } from "@/components/sessions/SessionDrawer";
import { TokenCell } from "@/components/sessions/TokenCell";
import type { Session, StoredEvent } from "@/lib/types";

type SortKey = "started_at" | "last_event_at" | "event_count" | "tokens";
type SortDir = "asc" | "desc";

interface SessionsTabProps {
  sessions: Session[];
  events: StoredEvent[];
  initialExpandedId?: string | null;
}

interface SessionGroup {
  taskName: string;
  sessions: Session[];
  totalEvents: number;
  totalTokens: number;
  hasActive: boolean;
  latestActivity: string;
}

function getTokenTotal(s: Session): number {
  return (s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0);
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-muted-foreground/40">↕</span>;
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

function extractProjectName(projectPath: string): string {
  if (!projectPath) return "__ungrouped__";
  // ~/dev/ai/services/cc-monitor → cc-monitor
  // ~/work/ishopcare-frontend → ishopcare-frontend
  // ~/dev/ai → ai
  const cleaned = projectPath.replace(/^~\/|\/$/g, "");
  return cleaned.split("/").pop() ?? "__ungrouped__";
}

function buildGroups(sessions: Session[]): SessionGroup[] {
  const map = new Map<string, Session[]>();

  for (const s of sessions) {
    const key = s.task_name ?? extractProjectName(s.project_path);
    const list = map.get(key);
    if (list) {
      list.push(s);
    } else {
      map.set(key, [s]);
    }
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

    groups.push({
      taskName: key,
      sessions: list,
      totalEvents,
      totalTokens,
      hasActive,
      latestActivity,
    });
  }

  // active 그룹 먼저, 그 다음 최신 활동 순
  groups.sort((a, b) => {
    if (a.hasActive !== b.hasActive) return a.hasActive ? -1 : 1;
    return b.latestActivity.localeCompare(a.latestActivity);
  });

  return groups;
}

function sortSessions(sessions: Session[], sortKey: SortKey, sortDir: SortDir): Session[] {
  return [...sessions].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;

    let cmp = 0;
    switch (sortKey) {
      case "started_at":
        cmp = new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
        break;
      case "last_event_at":
        cmp =
          new Date(a.last_event_at ?? a.ended_at ?? a.started_at).getTime() -
          new Date(b.last_event_at ?? b.ended_at ?? b.started_at).getTime();
        break;
      case "event_count":
        cmp = a.event_count - b.event_count;
        break;
      case "tokens":
        cmp = getTokenTotal(a) - getTokenTotal(b);
        break;
    }
    return sortDir === "desc" ? -cmp : cmp;
  });
}

export function SessionsTab({ sessions, events, initialExpandedId }: SessionsTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialExpandedId ?? null);
  const [sortKey, setSortKey] = useState<SortKey>("last_event_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(function syncInitialExpanded() {
    if (initialExpandedId) {
      setSelectedId(initialExpandedId);
    }
  }, [initialExpandedId]);

  useEffect(function handleEscKey() {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    if (selectedId) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [selectedId]);

  const groups = useMemo(() => buildGroups(sessions), [sessions]);
  const maxTokens = Math.max(...sessions.map(getTokenTotal), 1);

  function handleSelect(sessionId: string) {
    setSelectedId(selectedId === sessionId ? null : sessionId);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleGroup(taskName: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(taskName)) {
        next.delete(taskName);
      } else {
        next.add(taskName);
      }
      return next;
    });
  }

  const selectedSession = selectedId ? sessions.find((s) => s.session_id === selectedId) : null;
  const fallbackEvents = selectedId ? events.filter((e) => e.session_id === selectedId) : [];

  const thClass = "px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <>
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="!p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">프로젝트</th>
                  <th className="px-4 py-3">모델</th>
                  <th className={thClass} onClick={() => handleSort("started_at")}>
                    시작<SortIcon active={sortKey === "started_at"} dir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => handleSort("last_event_at")}>
                    최신 활동<SortIcon active={sortKey === "last_event_at"} dir={sortDir} />
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort("event_count")}>
                    이벤트<SortIcon active={sortKey === "event_count"} dir={sortDir} />
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort("tokens")}>
                    토큰<SortIcon active={sortKey === "tokens"} dir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.taskName);
                  const sorted = sortSessions(group.sessions, sortKey, sortDir);
                  const displayName = group.taskName === "__ungrouped__" ? "미분류" : group.taskName;

                  return (
                    <GroupRows
                      key={group.taskName}
                      group={group}
                      displayName={displayName}
                      isCollapsed={isCollapsed}
                      sortedSessions={sorted}
                      selectedId={selectedId}
                      maxTokens={maxTokens}
                      onToggle={() => toggleGroup(group.taskName)}
                      onSelect={handleSelect}
                    />
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {selectedSession && (
        <SessionDrawer
          session={selectedSession}
          fallbackEvents={fallbackEvents}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

interface GroupRowsProps {
  group: SessionGroup;
  displayName: string;
  isCollapsed: boolean;
  sortedSessions: Session[];
  selectedId: string | null;
  maxTokens: number;
  onToggle: () => void;
  onSelect: (id: string) => void;
}

function GroupRows({ group, displayName, isCollapsed, sortedSessions, selectedId, maxTokens, onToggle, onSelect }: GroupRowsProps) {
  // 그룹이 1개 세션이면 그룹 헤더 없이 바로 표시
  if (group.sessions.length === 1) {
    const s = group.sessions[0];
    return (
      <SessionRow
        session={s}
        selectedId={selectedId}
        maxTokens={maxTokens}
        onSelect={onSelect}
        indent={false}
        taskLabel={displayName !== "미분류" ? displayName : undefined}
      />
    );
  }

  return (
    <>
      {/* 그룹 헤더 */}
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
      {/* 그룹 내 세션들 */}
      {!isCollapsed &&
        sortedSessions.map((s) => (
          <SessionRow
            key={s.session_id}
            session={s}
            selectedId={selectedId}
            maxTokens={maxTokens}
            onSelect={onSelect}
            indent={true}
          />
        ))}
    </>
  );
}

interface SessionRowProps {
  session: Session;
  selectedId: string | null;
  maxTokens: number;
  onSelect: (id: string) => void;
  indent: boolean;
  taskLabel?: string;
}

function SessionRow({ session: s, selectedId, maxTokens, onSelect, indent, taskLabel }: SessionRowProps) {
  return (
    <tr
      onClick={() => onSelect(s.session_id)}
      className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30 ${
        selectedId === s.session_id ? "bg-muted/40" : ""
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
          <span className="text-[10px] font-mono text-muted-foreground/50">{s.session_id}</span>
          {taskLabel && (
            <Badge variant="outline" className="text-[9px] text-muted-foreground/60">{taskLabel}</Badge>
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
