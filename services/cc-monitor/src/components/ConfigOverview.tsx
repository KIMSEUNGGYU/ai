import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConfigData {
  user_id: string;
  session_id: string;
  started_at: string;
  config_claude_md_count: number | null;
  config_rules_count: number | null;
  config_mcp_count: number | null;
  config_hooks_count: number | null;
  config_mcp_names: string | null;
  config_rules_names: string | null;
  config_claude_md_paths: string | null;
  config_hooks_events: string | null;
}

function parseJsonArray(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

export function ConfigOverview() {
  const [configs, setConfigs] = useState<ConfigData[]>([]);

  useEffect(function fetchConfigs() {
    fetch("/api/config").then((r) => r.json()).then((d) => setConfigs(d.configs ?? []));
  }, []);

  if (configs.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        설정 데이터가 없습니다. 세션을 시작하면 수집됩니다.
      </CardContent></Card>
    );
  }

  // 전체 MCP 채택률 계산
  const allMcps = new Map<string, number>();
  for (const c of configs) {
    for (const name of parseJsonArray(c.config_mcp_names)) {
      allMcps.set(name, (allMcps.get(name) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 전체 요약 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">사용자</p>
            <p className="text-2xl font-bold text-foreground">{configs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">평균 MCP</p>
            <p className="text-2xl font-bold text-foreground">
              {(configs.reduce((sum, c) => sum + (c.config_mcp_count ?? 0), 0) / configs.length).toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">평균 Rules</p>
            <p className="text-2xl font-bold text-foreground">
              {(configs.reduce((sum, c) => sum + (c.config_rules_count ?? 0), 0) / configs.length).toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">평균 Hooks</p>
            <p className="text-2xl font-bold text-foreground">
              {(configs.reduce((sum, c) => sum + (c.config_hooks_count ?? 0), 0) / configs.length).toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MCP 채택률 */}
      {allMcps.size > 0 && (
        <Card>
          <CardContent className="!p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">MCP 채택률</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(allMcps.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name} — {Math.round((count / configs.length) * 100)}%
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사용자별 카드 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {configs.map((c) => (
          <Card key={c.user_id}>
            <CardContent className="!p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{c.user_id}</h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.started_at).toLocaleString()}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{c.config_claude_md_count ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">CLAUDE.md</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{c.config_rules_count ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Rules</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{c.config_mcp_count ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">MCP</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{c.config_hooks_count ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Hooks</p>
                </div>
              </div>

              <div className="space-y-2">
                {parseJsonArray(c.config_mcp_names).length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">MCP: </span>
                    {parseJsonArray(c.config_mcp_names).map((name) => (
                      <Badge key={name} variant="outline" className="mr-1 text-[10px]">{name}</Badge>
                    ))}
                  </div>
                )}
                {parseJsonArray(c.config_rules_names).length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">Rules: </span>
                    {parseJsonArray(c.config_rules_names).map((name) => (
                      <Badge key={name} variant="outline" className="mr-1 text-[10px]">{name}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
