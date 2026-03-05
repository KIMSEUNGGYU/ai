import { useCallback, useEffect, useState } from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSessions } from "@/lib/queries";
import { getRecentEvents } from "@/lib/queries";
import { getToolUsageStats, getToolDurationStats, getHourlyActivity, getUserSummaries, getTokenUsageSummary } from "@/lib/queries";
import { isDemoMode } from "@/lib/db";
import { usePolling } from "@/hooks/usePolling";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SessionsTab } from "@/components/SessionsTab";
import { ToolUsageChart } from "@/components/ToolUsageChart";
import { HourlyActivity } from "@/components/HourlyActivity";
import { TokenUsage } from "@/components/TokenUsage";
import { CostTracking } from "@/components/CostTracking";
import { ConfigOverview } from "@/components/ConfigOverview";
import { TabNav } from "@/components/TabNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Session, StoredEvent, ToolUsageStat, ToolDurationStat, HourlyActivity as HourlyActivityType, UserSummary as UserSummaryType, TokenUsageSummary } from "@/lib/types";

interface DashboardData {
  sessions: Session[];
  events: StoredEvent[];
  tools: ToolUsageStat[];
  toolDurations: ToolDurationStat[];
  hourly: HourlyActivityType[];
  users: UserSummaryType[];
  tokenUsage: TokenUsageSummary;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "cost", label: "Cost" },
  { id: "sessions", label: "Sessions" },
  { id: "config", label: "Config" },
];

export const getServerSideProps: GetServerSideProps<{
  initial: DashboardData;
  isDemo: boolean;
}> = async () => {
  const [sessions, events, tools, toolDurations, hourly, users, tokenUsage] = await Promise.all([
    getSessions("active"),
    getRecentEvents(30),
    getToolUsageStats(24),
    getToolDurationStats(24),
    getHourlyActivity(24),
    getUserSummaries(),
    getTokenUsageSummary(),
  ]);

  return {
    props: {
      initial: { sessions, events, tools, toolDurations, hourly, users, tokenUsage },
      isDemo: isDemoMode(),
    },
  };
};

export default function Dashboard({
  initial,
  isDemo,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedToolName, setSelectedToolName] = useState("");
  const [allTools, setAllTools] = useState(initial.tools);
  const [allUsers, setAllUsers] = useState(initial.users);

  const buildFilterQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedUserId) params.set("userId", selectedUserId);
    if (selectedToolName) params.set("toolName", selectedToolName);
    return params.toString();
  }, [selectedUserId, selectedToolName]);

  const fetchSessions = useCallback(() => {
    const q = buildFilterQuery();
    return fetch(`/api/sessions${q ? `?${q}` : ""}`).then((r) => r.json()).then((d) => d.sessions as Session[]);
  }, [buildFilterQuery]);

  const fetchFeed = useCallback(() => {
    const q = buildFilterQuery();
    return fetch(`/api/feed?limit=30${q ? `&${q}` : ""}`).then((r) => r.json()).then((d) => d.events as StoredEvent[]);
  }, [buildFilterQuery]);

  const fetchAnalytics = useCallback(() => {
    const q = buildFilterQuery();
    return fetch(`/api/analytics${q ? `?${q}` : ""}`).then((r) => r.json()) as Promise<{
      tools: ToolUsageStat[];
      toolDurations: ToolDurationStat[];
      hourly: HourlyActivityType[];
      users: UserSummaryType[];
      tokenUsage: TokenUsageSummary;
    }>;
  }, [buildFilterQuery]);

  const { data: sessions } = usePolling(fetchSessions, 10_000);
  const { data: events } = usePolling(fetchFeed, 10_000);
  const { data: analytics } = usePolling(fetchAnalytics, 30_000);

  // 필터 없을 때만 드롭다운 옵션 갱신
  useEffect(function syncDropdownOptions() {
    if (!selectedUserId && !selectedToolName && analytics) {
      setAllTools(analytics.tools);
      setAllUsers(analytics.users);
    }
  }, [analytics, selectedUserId, selectedToolName]);

  const s = sessions ?? initial.sessions;
  const e = events ?? initial.events;
  const t = analytics?.tools ?? initial.tools;
  const td = analytics?.toolDurations ?? initial.toolDurations;
  const h = analytics?.hourly ?? initial.hourly;
  const tok = analytics?.tokenUsage ?? initial.tokenUsage;

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-baseline gap-3 md:gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">cc-monitor</h1>
          <span className="text-sm text-muted-foreground">Claude Code 모니터링 대시보드</span>
          {isDemo && (
            <Badge variant="secondary" className="border border-amber-500/40 bg-amber-500/10 text-amber-300">
              Demo Mode
            </Badge>
          )}
        </div>
      </header>

      <Card className="mb-6 border-border/80 bg-card/80">
        <CardContent className="flex flex-wrap items-center gap-4 !p-4">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          User
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">전체</option>
            {allUsers.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.user_id}
              </option>
            ))}
          </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tool
          <select
            value={selectedToolName}
            onChange={(e) => setSelectedToolName(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">전체</option>
            {allTools.map((tool) => (
              <option key={tool.tool_name} value={tool.tool_name}>
                {tool.tool_name} ({tool.count})
              </option>
            ))}
          </select>
          </label>

          {(selectedUserId || selectedToolName) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setSelectedUserId("");
                setSelectedToolName("");
              }}
            >
              초기화
            </Button>
          )}
        </CardContent>
      </Card>

      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <div className="flex flex-col gap-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <ToolUsageChart tools={t} durations={td} />
            <HourlyActivity hourly={h} />
          </div>
          <TokenUsage usage={tok} />
        </div>
      )}

      {activeTab === "cost" && <CostTracking userId={selectedUserId || undefined} />}

      {activeTab === "sessions" && <SessionsTab sessions={s} events={e} />}

      {activeTab === "config" && <ConfigOverview />}
    </div>
  );
}
