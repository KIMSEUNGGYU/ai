import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Session, StoredEvent } from "@/lib/types";

interface SessionsTabProps {
  sessions: Session[];
  events: StoredEvent[];
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

export function SessionsTab({ sessions, events }: SessionsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // active 먼저, 그 다음 ended, 시작시간 내림차순
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
                const sessionEvents = events.filter((e) => e.session_id === s.session_id);
                const toolSummary = parseToolSummary((s as unknown as Record<string, unknown>).tool_summary as string | null);

                return (
                  <>
                    <tr
                      key={s.session_id}
                      onClick={() => setExpandedId(isExpanded ? null : s.session_id)}
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
                          <div className="grid gap-4 lg:grid-cols-2">
                            {/* 토큰 요약 */}
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">토큰 사용량</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>Input: <span className="font-mono font-bold">{formatTokens(s.total_input_tokens)}</span></div>
                                <div>Output: <span className="font-mono font-bold">{formatTokens(s.total_output_tokens)}</span></div>
                                <div>Cache Write: <span className="font-mono font-bold">{formatTokens(s.total_cache_create_tokens)}</span></div>
                                <div>Cache Read: <span className="font-mono font-bold">{formatTokens(s.total_cache_read_tokens)}</span></div>
                                <div>Turns: <span className="font-mono font-bold">{s.num_turns ?? "-"}</span></div>
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

                            {/* 최근 이벤트 */}
                            {sessionEvents.length > 0 && (
                              <div className="lg:col-span-2">
                                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">최근 이벤트</h4>
                                <div className="space-y-1">
                                  {sessionEvents.slice(0, 5).map((ev) => (
                                    <div key={ev.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="text-[10px]">{ev.event_type}</Badge>
                                      {ev.tool_name && <span className="font-mono">{ev.tool_name}</span>}
                                      {ev.tool_input_summary && (
                                        <span className="truncate text-muted-foreground/60">{ev.tool_input_summary}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
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
