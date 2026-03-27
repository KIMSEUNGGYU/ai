import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { harnessQueryOptions, adoptionQueryOptions } from "@/lib/query-options";
import { generateAdoptionSnapshot } from "@/lib/remotes";
import type { HarnessResponse, AdoptionTimelineEntry } from "@/lib/remotes";
import { Button } from "@/components/ui/button";

interface HarnessTabProps {
  days?: number;
}

// ── 헬퍼 ──

function formatBytes(bytes: number): string {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

// ── 섹션 1: 스킬 사용 빈도 ──

function SkillUsageSection({ data }: { data: HarnessResponse["skills"] }) {
  if (data.skills.length === 0) {
    return (
      <div className="text-muted-foreground/60 italic text-[13px] py-4">
        아직 스킬 사용 기록이 없습니다
      </div>
    );
  }

  const maxCount = Math.max(...data.skills.map((s) => s.count));

  return (
    <div>
      <div className="space-y-1.5">
        {data.skills.map((skill) => {
          const pct = maxCount > 0 ? (skill.count / maxCount) * 100 : 0;
          return (
            <div key={skill.name} className="flex items-center gap-2 py-1">
              <span className="w-[120px] shrink-0 text-xs font-semibold text-foreground truncate" title={skill.name}>
                {skill.name}
              </span>
              <div className="flex-1 h-3.5 bg-border/40 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm bg-violet-700 transition-[width] duration-300"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="w-[40px] text-right text-xs font-bold text-violet-400 shrink-0">{skill.count}</span>
            </div>
          );
        })}
      </div>

      {data.daily.length > 0 && <SkillDailyChart daily={data.daily} />}
    </div>
  );
}

function SkillDailyChart({ daily }: { daily: HarnessResponse["skills"]["daily"] }) {
  const dates = [...new Set(daily.map((d) => d.date))].sort();
  const skills = [...new Set(daily.map((d) => d.skill))];
  const colors = ["bg-violet-700", "bg-blue-700", "bg-emerald-700", "bg-amber-700", "bg-rose-700"];

  const dateMap = new Map<string, Map<string, number>>();
  for (const d of daily) {
    if (!dateMap.has(d.date)) dateMap.set(d.date, new Map());
    dateMap.get(d.date)!.set(d.skill, d.count);
  }

  const maxTotal = Math.max(
    ...dates.map((date) => {
      const map = dateMap.get(date)!;
      return skills.reduce((sum, s) => sum + (map.get(s) ?? 0), 0);
    }),
    1,
  );

  return (
    <div className="mt-4">
      <h4 className="text-[10px] font-semibold tracking-wide text-muted-foreground mb-2 uppercase">Daily Trend (Top 5)</h4>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {skills.map((s, i) => (
          <span key={s} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={`inline-block w-2 h-2 rounded-sm ${colors[i % colors.length]}`} />
            {s}
          </span>
        ))}
      </div>
      <div className="flex items-end gap-0.5 h-[80px]">
        {dates.map((date) => {
          const map = dateMap.get(date)!;
          const total = skills.reduce((sum, s) => sum + (map.get(s) ?? 0), 0);
          const pct = (total / maxTotal) * 100;
          return (
            <div key={date} className="flex-1 flex flex-col items-center h-full" title={`${date}: ${total}회`}>
              <div className="flex-1 w-full flex items-end justify-center">
                <div className="w-4/5 max-w-5 flex flex-col-reverse" style={{ height: `${Math.max(pct, 3)}%` }}>
                  {skills.map((s, i) => {
                    const count = map.get(s) ?? 0;
                    if (count === 0) return null;
                    const segPct = (count / total) * 100;
                    return (
                      <div
                        key={s}
                        className={`w-full ${colors[i % colors.length]} first:rounded-b-sm last:rounded-t-sm`}
                        style={{ height: `${segPct}%` }}
                      />
                    );
                  })}
                </div>
              </div>
              <span className="text-[9px] text-muted-foreground/60 mt-1 whitespace-nowrap">{date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 섹션 2: 컨벤션 주입 시각화 ──

function ConventionSection({ data }: { data: HarnessResponse["conventions"] }) {
  if (data.conventions.length === 0) {
    return (
      <div className="text-muted-foreground/60 italic text-[13px] py-4">
        fe-workflow 플러그인 훅이 활성화되면 컨벤션 주입 데이터가 표시됩니다
      </div>
    );
  }

  const maxCount = Math.max(...data.conventions.map((c) => c.count));

  return (
    <div>
      {/* 바 차트 */}
      <div className="space-y-1.5 mb-4">
        {data.conventions.map((conv) => {
          const pct = maxCount > 0 ? (conv.count / maxCount) * 100 : 0;
          return (
            <div key={conv.name} className="flex items-center gap-2 py-1">
              <span className="w-[140px] shrink-0 text-xs font-semibold text-foreground truncate" title={conv.name}>
                {conv.name}
              </span>
              <div className="flex-1 h-3.5 bg-border/40 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm bg-cyan-700 transition-[width] duration-300"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="w-[40px] text-right text-xs font-bold text-cyan-400 shrink-0">{conv.count}</span>
            </div>
          );
        })}
      </div>

      {/* 상세 테이블 */}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
            <th className="text-left py-1.5 pr-2">Convention</th>
            <th className="text-right py-1.5 px-2">Count</th>
            <th className="text-right py-1.5 px-2">Bytes</th>
            <th className="text-left py-1.5 pl-2">Keywords</th>
          </tr>
        </thead>
        <tbody>
          {data.conventions.map((conv) => (
            <tr key={conv.name} className="border-b border-border/40">
              <td className="py-1.5 pr-2 font-medium text-foreground">{conv.name}</td>
              <td className="py-1.5 px-2 text-right text-cyan-400 font-bold">{conv.count}</td>
              <td className="py-1.5 px-2 text-right text-muted-foreground">{formatBytes(conv.totalBytes)}</td>
              <td className="py-1.5 pl-2 text-muted-foreground">
                {conv.topKeywords.length > 0 ? conv.topKeywords.join(", ") : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 섹션 3: Adoption 추세 ──

function AdoptionSection({ days }: { days: number }) {
  const [period, setPeriod] = useState<"day" | "week">("day");
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery(adoptionQueryOptions({ period, days }));
  const timeline = data?.timeline ?? [];

  const mutation = useMutation({
    mutationFn: () => generateAdoptionSnapshot(period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adoption"] });
    },
  });

  if (timeline.length === 0 && !isFetching) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-muted-foreground/60 italic text-[13px]">아직 스냅샷이 없습니다</p>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "day" | "week")}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "생성 중..." : "스냅샷 생성"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "day" | "week")}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "생성 중..." : "스냅샷 생성"}
        </Button>
      </div>

      {/* 비교 카드 */}
      {timeline.length >= 2 && <AdoptionCompareCards timeline={timeline} />}

      {/* 추세 차트 */}
      {timeline.length > 0 && <AdoptionTrendChart timeline={timeline} />}
    </div>
  );
}

function AdoptionCompareCards({ timeline }: { timeline: AdoptionTimelineEntry[] }) {
  const current = timeline[timeline.length - 1];
  const previous = timeline[timeline.length - 2];

  const metrics = [
    { label: "Sessions", current: current.total_sessions, previous: previous.total_sessions },
    { label: "Avg Turns", current: current.avg_turns_per_session, previous: previous.avg_turns_per_session },
    { label: "Avg Duration", current: current.avg_session_duration_min, previous: previous.avg_session_duration_min, unit: "min" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {metrics.map((m) => {
        const diff = m.previous > 0 ? ((m.current - m.previous) / m.previous) * 100 : 0;
        const isUp = diff > 0;
        return (
          <div key={m.label} className="flex flex-col items-center gap-1 px-2 py-2.5 bg-card border border-border rounded-md">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{m.label}</span>
            <span className="text-base font-bold text-amber-400">
              {typeof m.current === "number" ? (Number.isInteger(m.current) ? m.current : m.current.toFixed(1)) : m.current}
              {m.unit ? ` ${m.unit}` : ""}
            </span>
            {diff !== 0 && (
              <span className={`text-[10px] ${isUp ? "text-green-400" : "text-red-400"}`}>
                {isUp ? "+" : ""}{diff.toFixed(1)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdoptionTrendChart({ timeline }: { timeline: AdoptionTimelineEntry[] }) {
  const maxSessions = Math.max(...timeline.map((t) => t.total_sessions), 1);

  return (
    <div>
      <h4 className="text-[10px] font-semibold tracking-wide text-muted-foreground mb-2 uppercase">Sessions Trend</h4>
      <div className="flex items-end gap-0.5 h-[80px]">
        {timeline.map((t) => {
          const pct = (t.total_sessions / maxSessions) * 100;
          return (
            <div key={t.snapshot_date} className="flex-1 flex flex-col items-center h-full" title={`${t.snapshot_date}: ${t.total_sessions} sessions`}>
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className="w-4/5 max-w-5 bg-amber-700 rounded-t-sm transition-[height] duration-300"
                  style={{ height: `${Math.max(pct, 3)}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground/60 mt-1 whitespace-nowrap">{t.snapshot_date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 섹션 4: Config 변화 추적 ──

function ConfigSection({ data }: { data: HarnessResponse["config"] }) {
  if (data.timeline.length === 0) {
    return (
      <div className="text-muted-foreground/60 italic text-[13px] py-4">
        Config 데이터가 있는 세션이 필요합니다
      </div>
    );
  }

  return (
    <div>
      <ConfigCountChart timeline={data.timeline} />
      {data.changes.length > 0 && <ConfigChangesTable changes={data.changes} />}
    </div>
  );
}

function ConfigCountChart({ timeline }: { timeline: HarnessResponse["config"]["timeline"] }) {
  const categories = [
    { key: "rulesCount" as const, label: "Rules", color: "bg-blue-700" },
    { key: "hooksCount" as const, label: "Hooks", color: "bg-emerald-700" },
    { key: "mcpCount" as const, label: "MCP", color: "bg-amber-700" },
    { key: "claudeMdCount" as const, label: "CLAUDE.md", color: "bg-violet-700" },
  ];

  const maxVal = Math.max(
    ...timeline.flatMap((t) => categories.map((c) => t[c.key])),
    1,
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        {categories.map((c) => (
          <span key={c.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={`inline-block w-2 h-2 rounded-sm ${c.color}`} />
            {c.label}
          </span>
        ))}
      </div>

      {/* 간단한 데이터 표 (타임라인이 길지 않으므로) */}
      <div className="space-y-1">
        {timeline.map((t) => (
          <div key={t.date} className="flex items-center gap-2 text-xs">
            <span className="w-[70px] shrink-0 text-muted-foreground">{t.date.slice(5)}</span>
            {categories.map((c) => (
              <div key={c.key} className="flex items-center gap-1">
                <div
                  className={`h-3 rounded-sm ${c.color}`}
                  style={{ width: `${Math.max((t[c.key] / maxVal) * 60, 4)}px` }}
                />
                <span className="text-[10px] text-muted-foreground w-4">{t[c.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigChangesTable({ changes }: { changes: HarnessResponse["config"]["changes"] }) {
  // 최신 변경사항 먼저 (첫 날의 'added' 전부는 노이즈일 수 있으므로 최근 20개만)
  const recent = [...changes].reverse().slice(0, 20);

  return (
    <div className="mt-4">
      <h4 className="text-[10px] font-semibold tracking-wide text-muted-foreground mb-2 uppercase">Recent Changes</h4>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
            <th className="text-left py-1.5 pr-2">Date</th>
            <th className="text-center py-1.5 px-2">Type</th>
            <th className="text-left py-1.5 px-2">Category</th>
            <th className="text-left py-1.5 pl-2">Item</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((change, i) => (
            <tr key={`${change.date}-${change.category}-${change.item}-${i}`} className="border-b border-border/40">
              <td className="py-1.5 pr-2 text-muted-foreground">{change.date.slice(5)}</td>
              <td className="py-1.5 px-2 text-center">
                <span className={`text-[10px] font-bold ${change.type === "added" ? "text-green-400" : "text-red-400"}`}>
                  {change.type === "added" ? "+" : "-"}
                </span>
              </td>
              <td className="py-1.5 px-2 text-muted-foreground capitalize">{change.category.replace("_", " ")}</td>
              <td className="py-1.5 pl-2 font-medium text-foreground truncate max-w-[200px]" title={change.item}>{change.item}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 메인 컴포넌트 ──

export function HarnessTab({ days = 30 }: HarnessTabProps) {
  const { data, isFetching, error } = useQuery(harnessQueryOptions({ days }));

  return (
    <div className="flex flex-col gap-8">
      {!data && isFetching && <p className="text-muted-foreground/60 italic text-[13px]">Loading...</p>}
      {error && !data && <p className="text-red-400 text-[13px]">{error.message}</p>}

      {data && (
        <>
          {/* 섹션 1: Skills */}
          <section className={isFetching ? "opacity-70 transition-opacity" : ""}>
            <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground mb-3 uppercase">Skill Usage</h2>
            <SkillUsageSection data={data.skills} />
          </section>

          {/* 섹션 2: Conventions */}
          <section className={isFetching ? "opacity-70 transition-opacity" : ""}>
            <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground mb-3 uppercase">Convention Injection</h2>
            <ConventionSection data={data.conventions} />
          </section>

          {/* 섹션 3: Adoption */}
          <section>
            <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground mb-3 uppercase">Adoption Trend</h2>
            <AdoptionSection days={days} />
          </section>

          {/* 섹션 4: Config */}
          <section className={isFetching ? "opacity-70 transition-opacity" : ""}>
            <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground mb-3 uppercase">Config Changes</h2>
            <ConfigSection data={data.config} />
          </section>
        </>
      )}
    </div>
  );
}
