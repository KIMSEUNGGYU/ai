// ── Harness 탭 쿼리 ──
// 기존 events/sessions 데이터를 활용하여 하네스 품질 메트릭을 산출한다.

import { prisma } from "./db";
import type { AdoptionSnapshot, AdoptionPeriod } from "./types";

// ── 타입 ──

export interface SkillUsageStat {
  name: string;
  count: number;
}

export interface SkillDailyUsage {
  date: string;
  skill: string;
  count: number;
}

export interface SkillUsageStats {
  skills: SkillUsageStat[];
  daily: SkillDailyUsage[];
}

export interface ConventionStat {
  name: string;
  count: number;
  totalBytes: number;
  topKeywords: string[];
}

export interface ConventionDailyUsage {
  date: string;
  convention: string;
  count: number;
}

export interface ConventionInjectionStats {
  conventions: ConventionStat[];
  daily: ConventionDailyUsage[];
}

export interface ConfigTimelineEntry {
  date: string;
  rulesCount: number;
  hooksCount: number;
  mcpCount: number;
  claudeMdCount: number;
}

export interface ConfigChange {
  date: string;
  type: "added" | "removed";
  category: "rules" | "hooks" | "mcp" | "claude_md";
  item: string;
}

export interface ConfigTimeline {
  timeline: ConfigTimelineEntry[];
  changes: ConfigChange[];
}

export interface HarnessData {
  skills: SkillUsageStats;
  conventions: ConventionInjectionStats;
  config: ConfigTimeline;
}

// ── 헬퍼 ──

function getSinceDate(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ── 섹션 1: 스킬 사용 빈도 ──

interface SkillEventRow {
  tool_input_summary: string | null;
  timestamp: string;
}

export async function getSkillUsageStats(days: number): Promise<SkillUsageStats> {
  const conditions = [
    "tool_name = 'Skill'",
    "event_type = 'PostToolUse'",
  ];
  const params: unknown[] = [];

  if (days > 0) {
    conditions.push("timestamp > ?");
    params.push(getSinceDate(days));
  }

  const rows = await prisma.$queryRawUnsafe<SkillEventRow[]>(`
    SELECT tool_input_summary, timestamp
    FROM events
    WHERE ${conditions.join(" AND ")}
    ORDER BY timestamp ASC
  `, ...params);

  // 스킬명 추출: "skill: recap" → "recap"
  const skillCounts = new Map<string, number>();
  const dailyMap = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const name = row.tool_input_summary?.replace(/^skill:\s*/, "") ?? "unknown";
    skillCounts.set(name, (skillCounts.get(name) ?? 0) + 1);

    const date = row.timestamp.slice(0, 10);
    if (!dailyMap.has(date)) dailyMap.set(date, new Map());
    const daySkills = dailyMap.get(date)!;
    daySkills.set(name, (daySkills.get(name) ?? 0) + 1);
  }

  const skills = Array.from(skillCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 일별 추이: 상위 5개 스킬만
  const top5 = new Set(skills.slice(0, 5).map((s) => s.name));
  const daily: SkillDailyUsage[] = [];
  for (const [date, skillMap] of dailyMap) {
    for (const [skill, count] of skillMap) {
      if (top5.has(skill)) {
        daily.push({ date, skill, count });
      }
    }
  }

  return { skills, daily };
}

// ── 섹션 2: 컨벤션 주입 시각화 ──

interface PluginHookRow {
  raw_data: string | null;
  timestamp: string;
}

interface PluginHookRawData {
  injected_conventions?: string[];
  injection_bytes?: number[];
  injection_total_bytes?: number;
  matched_keywords?: string[];
}

export async function getConventionInjectionStats(days: number): Promise<ConventionInjectionStats> {
  const conditions = ["event_type = 'PluginHook'", "raw_data IS NOT NULL"];
  const params: unknown[] = [];

  if (days > 0) {
    conditions.push("timestamp > ?");
    params.push(getSinceDate(days));
  }

  const rows = await prisma.$queryRawUnsafe<PluginHookRow[]>(`
    SELECT raw_data, timestamp
    FROM events
    WHERE ${conditions.join(" AND ")}
    ORDER BY timestamp ASC
  `, ...params);

  const convMap = new Map<string, { count: number; totalBytes: number; keywords: Map<string, number> }>();
  const dailyMap = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const data = safeJsonParse<PluginHookRawData>(row.raw_data, {});
    const conventions = data.injected_conventions ?? [];
    const bytes = data.injection_bytes ?? [];
    const keywords = data.matched_keywords ?? [];
    const date = row.timestamp.slice(0, 10);

    for (let i = 0; i < conventions.length; i++) {
      const name = conventions[i];
      if (!convMap.has(name)) {
        convMap.set(name, { count: 0, totalBytes: 0, keywords: new Map() });
      }
      const entry = convMap.get(name)!;
      entry.count += 1;
      entry.totalBytes += bytes[i] ?? 0;

      for (const kw of keywords) {
        entry.keywords.set(kw, (entry.keywords.get(kw) ?? 0) + 1);
      }

      if (!dailyMap.has(date)) dailyMap.set(date, new Map());
      const dayConv = dailyMap.get(date)!;
      dayConv.set(name, (dayConv.get(name) ?? 0) + 1);
    }
  }

  const conventions = Array.from(convMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      totalBytes: data.totalBytes,
      topKeywords: Array.from(data.keywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw),
    }))
    .sort((a, b) => b.count - a.count);

  const daily: ConventionDailyUsage[] = [];
  for (const [date, convCounts] of dailyMap) {
    for (const [convention, count] of convCounts) {
      daily.push({ date, convention, count });
    }
  }

  return { conventions, daily };
}

// ── 섹션 3: Adoption 스냅샷 ──

interface SessionAggRow {
  active_users: number;
  total_users: number;
  total_sessions: number;
  avg_duration_min: number;
  avg_sessions_per_user: number;
  avg_turns: number;
}

interface ToolSummaryRow {
  tool_summary: string | null;
}

export async function generateAdoptionSnapshot(period: "day" | "week"): Promise<AdoptionSnapshot> {
  const today = new Date().toISOString().slice(0, 10);
  const daysBack = period === "day" ? 1 : 7;
  const since = getSinceDate(daysBack);

  const [aggRows] = await prisma.$queryRawUnsafe<SessionAggRow[]>(`
    SELECT
      COUNT(DISTINCT user_id) as active_users,
      (SELECT COUNT(DISTINCT user_id) FROM sessions) as total_users,
      COUNT(*) as total_sessions,
      COALESCE(AVG(
        CASE WHEN ended_at IS NOT NULL
          THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
          ELSE NULL
        END
      ), 0) as avg_duration_min,
      CASE WHEN COUNT(DISTINCT user_id) > 0
        THEN CAST(COUNT(*) AS FLOAT) / COUNT(DISTINCT user_id)
        ELSE 0
      END as avg_sessions_per_user,
      COALESCE(AVG(num_turns), 0) as avg_turns
    FROM sessions
    WHERE started_at > ?
  `, since);

  // tool_summary 합산
  const toolRows = await prisma.$queryRawUnsafe<ToolSummaryRow[]>(`
    SELECT tool_summary FROM sessions
    WHERE started_at > ? AND tool_summary IS NOT NULL
  `, since);

  const toolTotals = new Map<string, number>();
  for (const row of toolRows) {
    const summary = safeJsonParse<Record<string, number>>(row.tool_summary, {});
    for (const [tool, count] of Object.entries(summary)) {
      toolTotals.set(tool, (toolTotals.get(tool) ?? 0) + count);
    }
  }

  const topTools = Array.from(toolTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tool_name, total_uses]) => ({
      tool_name,
      unique_users: 0,
      adoption_rate: 0,
      total_uses,
      avg_uses_per_user: 0,
    }));

  const agg = aggRows ?? {
    active_users: 0,
    total_users: 0,
    total_sessions: 0,
    avg_duration_min: 0,
    avg_sessions_per_user: 0,
    avg_turns: 0,
  };

  const snapshot: AdoptionSnapshot = {
    snapshot_date: today,
    period: period as AdoptionPeriod,
    active_users: Number(agg.active_users),
    total_users: Number(agg.total_users),
    total_sessions: Number(agg.total_sessions),
    avg_session_duration_min: Number(agg.avg_duration_min),
    avg_sessions_per_user: Number(agg.avg_sessions_per_user),
    avg_turns_per_session: Number(agg.avg_turns),
    top_tools_json: JSON.stringify(topTools),
  };

  // upsert (같은 날짜+period면 업데이트)
  const existing = await prisma.adoptionSnapshot.findFirst({
    where: { snapshot_date: today, period },
  });

  if (existing) {
    await prisma.adoptionSnapshot.update({
      where: { id: existing.id },
      data: snapshot,
    });
    snapshot.id = existing.id;
  } else {
    const created = await prisma.adoptionSnapshot.create({ data: snapshot });
    snapshot.id = created.id;
  }

  return snapshot;
}

export async function getAdoptionTimeline(
  period: "day" | "week" = "day",
  days: number = 30,
): Promise<AdoptionSnapshot[]> {
  const since = days > 0
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : "2000-01-01";

  return await prisma.adoptionSnapshot.findMany({
    where: {
      period,
      snapshot_date: { gte: since },
    },
    orderBy: { snapshot_date: "asc" },
  }) as AdoptionSnapshot[];
}

// ── 섹션 4: Config 변화 추적 ──

interface ConfigSessionRow {
  date: string;
  config_rules_count: number | null;
  config_hooks_count: number | null;
  config_mcp_count: number | null;
  config_claude_md_count: number | null;
  config_rules_names: string | null;
  config_mcp_names: string | null;
  config_hooks_events: string | null;
  config_claude_md_paths: string | null;
}

export async function getConfigTimeline(days: number): Promise<ConfigTimeline> {
  const conditions = ["config_rules_count IS NOT NULL"];
  const params: unknown[] = [];

  if (days > 0) {
    conditions.push("started_at > ?");
    params.push(getSinceDate(days));
  }

  // 날짜별 마지막 세션의 config 추출
  const rows = await prisma.$queryRawUnsafe<ConfigSessionRow[]>(`
    SELECT
      DATE(started_at) as date,
      config_rules_count,
      config_hooks_count,
      config_mcp_count,
      config_claude_md_count,
      config_rules_names,
      config_mcp_names,
      config_hooks_events,
      config_claude_md_paths
    FROM sessions
    WHERE ${conditions.join(" AND ")}
    AND session_id IN (
      SELECT session_id FROM (
        SELECT session_id, ROW_NUMBER() OVER (
          PARTITION BY DATE(started_at)
          ORDER BY started_at DESC
        ) as rn
        FROM sessions
        WHERE ${conditions.join(" AND ")}
      ) WHERE rn = 1
    )
    ORDER BY date ASC
  `, ...params, ...params);

  const timeline: ConfigTimelineEntry[] = [];
  const changes: ConfigChange[] = [];

  let prevSets: Record<string, Set<string>> | null = null;

  for (const row of rows) {
    timeline.push({
      date: row.date,
      rulesCount: Number(row.config_rules_count ?? 0),
      hooksCount: Number(row.config_hooks_count ?? 0),
      mcpCount: Number(row.config_mcp_count ?? 0),
      claudeMdCount: Number(row.config_claude_md_count ?? 0),
    });

    const currentSets: Record<string, Set<string>> = {
      rules: new Set(safeJsonParse<string[]>(row.config_rules_names, [])),
      hooks: new Set(safeJsonParse<string[]>(row.config_hooks_events, [])),
      mcp: new Set(safeJsonParse<string[]>(row.config_mcp_names, [])),
      claude_md: new Set(safeJsonParse<string[]>(row.config_claude_md_paths, [])),
    };

    if (prevSets) {
      for (const category of ["rules", "hooks", "mcp", "claude_md"] as const) {
        const prev = prevSets[category];
        const curr = currentSets[category];

        for (const item of curr) {
          if (!prev.has(item)) {
            changes.push({ date: row.date, type: "added", category, item });
          }
        }
        for (const item of prev) {
          if (!curr.has(item)) {
            changes.push({ date: row.date, type: "removed", category, item });
          }
        }
      }
    } else {
      // 첫 날: 모든 항목을 'added'로
      for (const category of ["rules", "hooks", "mcp", "claude_md"] as const) {
        for (const item of currentSets[category]) {
          changes.push({ date: row.date, type: "added", category, item });
        }
      }
    }

    prevSets = currentSets;
  }

  return { timeline, changes };
}

// ── 번들 쿼리 (API Route용) ──

export async function getHarnessData(days: number): Promise<HarnessData> {
  const [skills, conventions, config] = await Promise.all([
    getSkillUsageStats(days),
    getConventionInjectionStats(days),
    getConfigTimeline(days),
  ]);

  return { skills, conventions, config };
}
