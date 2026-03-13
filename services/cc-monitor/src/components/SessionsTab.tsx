import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, shortPath } from "@/lib/format";
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

function getTokenTotal(s: Session): number {
  return (s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0);
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-muted-foreground/40">↕</span>;
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export function SessionsTab({ sessions, events, initialExpandedId }: SessionsTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialExpandedId ?? null);
  const [sortKey, setSortKey] = useState<SortKey>("last_event_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  const sorted = [...sessions].sort((a, b) => {
    // active 항상 먼저
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

  const maxTokens = Math.max(...sessions.map(getTokenTotal), 1);

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
                    <td className="px-4 py-3">
                      <div className="text-muted-foreground">{shortPath(s.project_path)}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/50">{s.session_id.slice(0, 8)}</div>
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
                ))}
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
