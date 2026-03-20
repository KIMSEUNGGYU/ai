import { useEffect, useState } from "react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useQuery } from "@tanstack/react-query";
import { getSessions } from "@/lib/queries";
import { getRecentEvents } from "@/lib/queries";
import { getToolUsageStats, getToolDurationStats, getHourlyActivity, getUserSummaries, getTokenUsageSummary } from "@/lib/queries";
import { sessionsQueryOptions, feedQueryOptions, analyticsQueryOptions } from "@/lib/query-options";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SessionsTab } from "@/components/SessionsTab";
import { ToolUsageChart } from "@/components/ToolUsageChart";
import { HourlyActivity } from "@/components/HourlyActivity";
import { TokenUsage } from "@/components/TokenUsage";
import { CostTracking } from "@/components/CostTracking";
import { ConfigOverview } from "@/components/ConfigOverview";
import { AnalysisTab } from "@/components/AnalysisTab";
import { HistoryTab } from "@/components/HistoryTab";
import { TabNav } from "@/components/TabNav";
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

const TAB_IDS = ["overview", "sessions", "history", "analysis", "config"] as const;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "history", label: "History" },
  { id: "analysis", label: "Analysis" },
  { id: "config", label: "Config" },
];

const DAYS_OPTIONS = [
  { value: 7, label: "7일" },
  { value: 14, label: "14일" },
  { value: 30, label: "30일" },
  { value: 90, label: "90일" },
  { value: 0, label: "전체" },
];

export const getServerSideProps: GetServerSideProps<{
  initial: DashboardData;
}> = async () => {
  const [sessions, events, tools, toolDurations, hourly, users, tokenUsage] = await Promise.all([
    getSessions("all"),
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
    },
  };
};

export default function Dashboard({
  initial,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TAB_IDS).withDefault("overview"),
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedToolName, setSelectedToolName] = useState("");
  const [selectedDays, setSelectedDays] = useState(30);
  const [allTools, setAllTools] = useState(initial.tools);
  const [allUsers, setAllUsers] = useState(initial.users);

  const filterParams = {
    userId: selectedUserId || undefined,
    toolName: selectedToolName || undefined,
    days: selectedDays || undefined,
  };

  const { data: sessions } = useQuery({
    ...sessionsQueryOptions(filterParams),
    initialData: initial.sessions,
  });

  const { data: events } = useQuery({
    ...feedQueryOptions(filterParams),
    initialData: initial.events,
  });

  const { data: analytics } = useQuery({
    ...analyticsQueryOptions(filterParams),
    initialData: {
      tools: initial.tools,
      toolDurations: initial.toolDurations,
      hourly: initial.hourly,
      users: initial.users,
      tokenUsage: initial.tokenUsage,
    },
  });

  useEffect(function syncDropdownOptions() {
    if (!selectedUserId && !selectedToolName && analytics) {
      setAllTools(analytics.tools);
      setAllUsers(analytics.users);
    }
  }, [analytics, selectedUserId, selectedToolName]);

  const hasActiveFilter = selectedUserId || selectedToolName || selectedDays !== 30;

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-baseline gap-3 md:gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">cc-monitor</h1>
          <span className="text-sm text-muted-foreground">Claude Code 모니터링 대시보드</span>
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

          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Period
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
          >
            {DAYS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          </label>

          {hasActiveFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setSelectedUserId("");
                setSelectedToolName("");
                setSelectedDays(30);
              }}
            >
              초기화
            </Button>
          )}
        </CardContent>
      </Card>

      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as typeof activeTab)} />

      {activeTab === "overview" && (
        <div className="flex flex-col gap-8">
          <CostTracking userId={selectedUserId || undefined} days={selectedDays || undefined} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ToolUsageChart tools={analytics.tools} durations={analytics.toolDurations} />
            <HourlyActivity hourly={analytics.hourly} />
          </div>
          <TokenUsage usage={analytics.tokenUsage} />
        </div>
      )}

      {activeTab === "sessions" && <SessionsTab sessions={sessions} events={events} />}

      {activeTab === "history" && <HistoryTab filterParams={filterParams} />}

      {activeTab === "analysis" && <AnalysisTab filterParams={filterParams} />}

      {activeTab === "config" && <ConfigOverview />}
    </div>
  );
}
