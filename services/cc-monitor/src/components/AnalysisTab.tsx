import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";

interface ToolBreakdown {
  name: string;
  count: number;
}

interface AnalysisData {
  skills: ToolBreakdown[];
  agents: ToolBreakdown[];
  mcpServers: ToolBreakdown[];
  hooks: ToolBreakdown[];
  commands: ToolBreakdown[];
  slashCommands: ToolBreakdown[];
}

function fetchAnalysisData(): Promise<AnalysisData> {
  return apiClient.get("analysis").json<AnalysisData>();
}

const SECTION_COLORS = {
  skills: { bar: "bg-violet-500", badge: "text-violet-400", icon: "text-violet-400" },
  agents: { bar: "bg-emerald-500", badge: "text-emerald-400", icon: "text-emerald-400" },
  mcpServers: { bar: "bg-teal-500", badge: "text-teal-400", icon: "text-teal-400" },
  hooks: { bar: "bg-orange-500", badge: "text-orange-400", icon: "text-orange-400" },
  commands: { bar: "bg-blue-500", badge: "text-blue-400", icon: "text-blue-400" },
  slashCommands: { bar: "bg-pink-500", badge: "text-pink-400", icon: "text-pink-400" },
} as const;

function BreakdownSection({
  title,
  items,
  colorKey,
}: {
  title: string;
  items: ToolBreakdown[];
  colorKey: keyof typeof SECTION_COLORS;
}) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);
  const total = items.reduce((sum, i) => sum + i.count, 0);
  const colors = SECTION_COLORS[colorKey];

  return (
    <Card>
      <CardContent className="!p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className={`text-xs font-mono ${colors.badge}`}>
            {items.length}종 / {total}회
          </span>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">데이터 없음</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.name} className="group">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.name}
                  </span>
                  <span className="ml-2 shrink-0 tabular-nums text-muted-foreground">
                    {item.count}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted/50">
                  <div
                    className={`h-full rounded-full ${colors.bar} transition-all`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalysisTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["analysis"],
    queryFn: fetchAnalysisData,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        {([
          { label: "Skills", count: data.skills.reduce((s, i) => s + i.count, 0), types: data.skills.length, color: "text-violet-400" },
          { label: "Agents", count: data.agents.reduce((s, i) => s + i.count, 0), types: data.agents.length, color: "text-emerald-400" },
          { label: "MCP", count: data.mcpServers.reduce((s, i) => s + i.count, 0), types: data.mcpServers.length, color: "text-teal-400" },
          { label: "Hooks", count: data.hooks.reduce((s, i) => s + i.count, 0), types: data.hooks.length, color: "text-orange-400" },
          { label: "Tools", count: data.commands.reduce((s, i) => s + i.count, 0), types: data.commands.length, color: "text-blue-400" },
          { label: "Slash Cmds", count: data.slashCommands.reduce((s, i) => s + i.count, 0), types: data.slashCommands.length, color: "text-pink-400" },
        ] as const).map((s) => (
          <Card key={s.label}>
            <CardContent className="!p-4 text-center">
              <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.count.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label} ({s.types}종)</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Slash Commands + Skills */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownSection title="Slash Commands" items={data.slashCommands} colorKey="slashCommands" />
        <BreakdownSection title="Skills" items={data.skills} colorKey="skills" />
      </div>

      {/* 나머지 분류 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownSection title="Agents" items={data.agents} colorKey="agents" />
        <BreakdownSection title="MCP Servers" items={data.mcpServers} colorKey="mcpServers" />
        <BreakdownSection title="Plugin Hooks" items={data.hooks} colorKey="hooks" />
      </div>

      <BreakdownSection title="Built-in Tools" items={data.commands} colorKey="commands" />
    </div>
  );
}
