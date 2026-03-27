import { useEffect, useState } from "react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useQuery } from "@tanstack/react-query";
import { getRecentEvents } from "@/lib/queries";
import { getUserSummaries, getTokenUsageSummary } from "@/lib/queries";
import { analyticsQueryOptions } from "@/lib/query-options";
import { CostTracking } from "@/components/CostTracking";
import { HistoryTab } from "@/components/HistoryTab";
import { HarnessTab } from "@/components/HarnessTab";
import { TabNav } from "@/components/TabNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StoredEvent, UserSummary as UserSummaryType, TokenUsageSummary } from "@/lib/types";

interface DashboardData {
  events: StoredEvent[];
  users: UserSummaryType[];
  tokenUsage: TokenUsageSummary;
}

const TAB_IDS = ["overview", "history", "harness"] as const;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
  { id: "harness", label: "Harness" },
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
  const [events, users, tokenUsage] = await Promise.all([
    getRecentEvents(30),
    getUserSummaries(),
    getTokenUsageSummary(),
  ]);

  return {
    props: {
      initial: { events, users, tokenUsage },
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
  const [selectedDays, setSelectedDays] = useState(7);
  const [allUsers, setAllUsers] = useState(initial.users);

  const filterParams = {
    userId: selectedUserId || undefined,
    toolName: selectedToolName || undefined,
    days: selectedDays || undefined,
  };

  const { data: analytics } = useQuery({
    ...analyticsQueryOptions(filterParams),
    initialData: {
      tools: [],
      toolDurations: [],
      hourly: [],
      users: initial.users,
      tokenUsage: initial.tokenUsage,
    },
  });

  useEffect(function syncDropdownOptions() {
    if (!selectedUserId && !selectedToolName && analytics) {
      setAllUsers(analytics.users);
    }
  }, [analytics, selectedUserId, selectedToolName]);

  const hasActiveFilter = selectedUserId || selectedToolName || selectedDays !== 7;

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
                setSelectedDays(7);
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
          <CostTracking userId={selectedUserId || undefined} days={selectedDays || undefined} tokenUsage={analytics.tokenUsage} />
        </div>
      )}

      {activeTab === "history" && <HistoryTab filterParams={filterParams} />}

      {activeTab === "harness" && <HarnessTab days={selectedDays || undefined} />}
    </div>
  );
}
