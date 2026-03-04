import { useCallback } from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getSessions } from "@/lib/queries";
import { getRecentEvents } from "@/lib/queries";
import { getToolUsageStats, getToolDurationStats, getHourlyActivity, getUserSummaries } from "@/lib/queries";
import { usePolling } from "@/hooks/usePolling";
import { ActiveSessions } from "@/components/ActiveSessions";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ToolUsageChart } from "@/components/ToolUsageChart";
import { HourlyActivity } from "@/components/HourlyActivity";
import { UserSummary } from "@/components/UserSummary";
import type { Session, StoredEvent, ToolUsageStat, ToolDurationStat, HourlyActivity as HourlyActivityType, UserSummary as UserSummaryType } from "@/lib/types";

interface DashboardData {
  sessions: Session[];
  events: StoredEvent[];
  tools: ToolUsageStat[];
  toolDurations: ToolDurationStat[];
  hourly: HourlyActivityType[];
  users: UserSummaryType[];
}

export const getServerSideProps: GetServerSideProps<{
  initial: DashboardData;
}> = async () => {
  return {
    props: {
      initial: {
        sessions: getSessions("active"),
        events: getRecentEvents(30),
        tools: getToolUsageStats(24),
        toolDurations: getToolDurationStats(24),
        hourly: getHourlyActivity(24),
        users: getUserSummaries(),
      },
    },
  };
};

export default function Dashboard({
  initial,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const fetchSessions = useCallback(
    () => fetch("/api/sessions").then((r) => r.json()).then((d) => d.sessions as Session[]),
    []
  );
  const fetchFeed = useCallback(
    () => fetch("/api/feed?limit=30").then((r) => r.json()).then((d) => d.events as StoredEvent[]),
    []
  );
  const fetchAnalytics = useCallback(
    () => fetch("/api/analytics").then((r) => r.json()) as Promise<{
      tools: ToolUsageStat[];
      toolDurations: ToolDurationStat[];
      hourly: HourlyActivityType[];
      users: UserSummaryType[];
    }>,
    []
  );

  const { data: sessions } = usePolling(fetchSessions, 10_000);
  const { data: events } = usePolling(fetchFeed, 10_000);
  const { data: analytics } = usePolling(fetchAnalytics, 30_000);

  const s = sessions ?? initial.sessions;
  const e = events ?? initial.events;
  const t = analytics?.tools ?? initial.tools;
  const td = analytics?.toolDurations ?? initial.toolDurations;
  const h = analytics?.hourly ?? initial.hourly;
  const u = analytics?.users ?? initial.users;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>cc-monitor</h1>
        <span style={styles.headerSub}>Claude Code 모니터링 대시보드</span>
      </header>

      <div style={styles.layout}>
        <div style={styles.left}>
          <ActiveSessions sessions={s} />
          <div style={styles.analyticsGrid}>
            <ToolUsageChart tools={t} durations={td} />
            <HourlyActivity hourly={h} />
          </div>
          <UserSummary users={u} />
        </div>
        <div style={styles.right}>
          <ActivityFeed events={e} />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 32px",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    gap: 16,
    marginBottom: 32,
    borderBottom: "1px solid #21262d",
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f0f6fc",
  },
  headerSub: {
    fontSize: 13,
    color: "#484f58",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 32,
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },
  right: {},
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
};
