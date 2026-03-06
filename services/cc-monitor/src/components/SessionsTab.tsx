import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, shortPath } from "@/lib/format";
import { SessionDrawer } from "@/components/sessions/SessionDrawer";
import { TokenCell } from "@/components/sessions/TokenCell";
import type { Session, StoredEvent } from "@/lib/types";

interface SessionsTabProps {
  sessions: Session[];
  events: StoredEvent[];
  initialExpandedId?: string | null;
}

export function SessionsTab({ sessions, events, initialExpandedId }: SessionsTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialExpandedId ?? null);

  useEffect(function syncInitialExpanded() {
    if (initialExpandedId) {
      setSelectedId(initialExpandedId);
    }
  }, [initialExpandedId]);

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

  function handleSelect(sessionId: string) {
    setSelectedId(selectedId === sessionId ? null : sessionId);
  }

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

  // fallback: useQuery 실패 시 전역 events에서 해당 세션 이벤트 추출
  const fallbackEvents = selectedId ? events.filter((e) => e.session_id === selectedId) : [];

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
          fallbackEvents={fallbackEvents}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
