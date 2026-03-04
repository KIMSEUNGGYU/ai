import { useCallback, useEffect, useState } from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { getSessions } from "@/lib/queries";
import { getRecentEvents } from "@/lib/queries";
import { getToolUsageStats, getToolDurationStats, getHourlyActivity, getUserSummaries, getTokenUsageSummary, getAdoptionSummary } from "@/lib/queries";
import { usePolling } from "@/hooks/usePolling";
import { ActiveSessions } from "@/components/ActiveSessions";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ToolUsageChart } from "@/components/ToolUsageChart";
import { HourlyActivity } from "@/components/HourlyActivity";
import { UserSummary } from "@/components/UserSummary";
import { TokenUsage } from "@/components/TokenUsage";
import { CostTracking } from "@/components/CostTracking";
import { AdoptionSummaryCards } from "@/components/AdoptionSummaryCards";
import { AdoptionTrendChart } from "@/components/AdoptionTrendChart";
import { ToolAdoptionChart } from "@/components/ToolAdoptionChart";
import type { Session, StoredEvent, ToolUsageStat, ToolDurationStat, HourlyActivity as HourlyActivityType, UserSummary as UserSummaryType, TokenUsageSummary, AdoptionSummary } from "@/lib/types";

interface DashboardData {
  sessions: Session[];
  events: StoredEvent[];
  tools: ToolUsageStat[];
  toolDurations: ToolDurationStat[];
  hourly: HourlyActivityType[];
  users: UserSummaryType[];
  tokenUsage: TokenUsageSummary;
  adoption: AdoptionSummary;
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
        tokenUsage: getTokenUsageSummary(),
        adoption: getAdoptionSummary(),
      },
    },
  };
};

export default function Dashboard({
  initial,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
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

  const fetchAdoption = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedUserId) params.set("userId", selectedUserId);
    const q = params.toString();
    return fetch(`/api/adoption${q ? `?${q}` : ""}`).then((r) => r.json()) as Promise<AdoptionSummary>;
  }, [selectedUserId]);

  const { data: sessions } = usePolling(fetchSessions, 10_000);
  const { data: events } = usePolling(fetchFeed, 10_000);
  const { data: analytics } = usePolling(fetchAnalytics, 30_000);
  const { data: adoptionData } = usePolling(fetchAdoption, 60_000);

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
  const u = analytics?.users ?? initial.users;
  const tok = analytics?.tokenUsage ?? initial.tokenUsage;
  const adopt = adoptionData ?? initial.adoption;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>cc-monitor</h1>
          <span style={styles.headerSub}>Claude Code 모니터링 대시보드</span>
        </div>
        <nav style={styles.nav}>
          <Link href="/prompt-logs" style={styles.navLink}>
            프롬프트 로그
          </Link>
        </nav>
      </header>

      <div style={styles.filterBar}>
        <label style={styles.filterLabel}>
          User
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">전체</option>
            {allUsers.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.user_id}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.filterLabel}>
          Tool
          <select
            value={selectedToolName}
            onChange={(e) => setSelectedToolName(e.target.value)}
            style={styles.filterSelect}
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
          <button
            onClick={() => {
              setSelectedUserId("");
              setSelectedToolName("");
            }}
            style={styles.filterReset}
          >
            초기화
          </button>
        )}
      </div>

      <div style={styles.layout}>
        <div style={styles.left}>
          <ActiveSessions sessions={s} />
          <div style={styles.analyticsGrid}>
            <ToolUsageChart tools={t} durations={td} />
            <HourlyActivity hourly={h} />
          </div>
          <TokenUsage usage={tok} />
          <CostTracking userId={selectedUserId || undefined} />
          <UserSummary users={u} />
        </div>
        <div style={styles.right}>
          <ActivityFeed events={e} />
          <div style={styles.adoptionSection}>
            <AdoptionSummaryCards summary={adopt} />
            <AdoptionTrendChart trend={adopt.trend} />
            <ToolAdoptionChart tools={adopt.top_tools} />
          </div>
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 32,
    borderBottom: "1px solid #21262d",
    paddingBottom: 16,
  },
  headerLeft: {
    display: "flex",
    alignItems: "baseline",
    gap: 16,
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
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  navLink: {
    fontSize: 13,
    color: "#58a6ff",
    textDecoration: "none",
    padding: "6px 14px",
    border: "1px solid #30363d",
    borderRadius: 6,
    background: "#161b22",
    fontWeight: 500,
    transition: "border-color 0.15s",
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
  right: {
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    padding: "12px 16px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 8,
  },
  filterLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#8b949e",
    fontWeight: 600,
  },
  filterSelect: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#c9d1d9",
    padding: "4px 8px",
    fontSize: 12,
  },
  filterReset: {
    background: "transparent",
    border: "1px solid #30363d",
    borderRadius: 4,
    color: "#f85149",
    padding: "4px 12px",
    fontSize: 11,
    cursor: "pointer",
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  adoptionSection: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    paddingTop: 8,
    borderTop: "1px solid #21262d",
  },
};
