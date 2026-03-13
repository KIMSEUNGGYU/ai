import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { StoredEvent } from "@/lib/types";

interface PluginHealthProps {
  events: StoredEvent[];
}

interface HealthCheck {
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

// 기대 규칙: 세션에서 특정 조건이 충족되면 특정 hook/skill이 발동되어야 함
interface ExpectRule {
  label: string;
  /** 이 규칙이 적용되는 조건 — true면 검사 대상 */
  when: (ctx: SessionContext) => boolean;
  /** 기대하는 발동이 있었는지 */
  check: (ctx: SessionContext) => HealthCheck;
}

interface SessionContext {
  events: StoredEvent[];
  hooks: StoredEvent[];
  skills: StoredEvent[];
  editedFiles: string[];
  hasToolUse: boolean;
}

function buildContext(events: StoredEvent[]): SessionContext {
  const hooks = events.filter((e) => e.tool_name?.includes(":") && !e.tool_name?.startsWith("mcp__"));
  const skills = events.filter((e) => e.tool_name === "Skill" && e.event_type === "PostToolUse");
  const editedFiles = events
    .filter((e) => (e.tool_name === "Edit" || e.tool_name === "Write") && e.tool_input_summary)
    .map((e) => e.tool_input_summary!)
    .filter((f, i, arr) => arr.indexOf(f) === i);
  const hasToolUse = events.some((e) => e.event_type === "PostToolUse");

  return { events, hooks, skills, editedFiles, hasToolUse };
}

const EXPECT_RULES: ExpectRule[] = [
  {
    label: "fe-convention-prompt",
    when: (ctx) => ctx.hasToolUse,
    check: (ctx) => {
      const fired = ctx.hooks.filter((e) => e.tool_name?.includes("fe-convention-prompt"));
      if (fired.length > 0) {
        return { label: "fe-convention-prompt", status: "pass", detail: `${fired.length}회 발동` };
      }
      return { label: "fe-convention-prompt", status: "fail", detail: "컨벤션 프롬프트 미발동" };
    },
  },
  {
    label: "post-edit-convention",
    when: (ctx) => ctx.editedFiles.some((f) => /\.(tsx?|jsx?)$/.test(f)),
    check: (ctx) => {
      const fired = ctx.hooks.filter((e) => e.tool_name?.includes("post-edit-convention"));
      const tsxEdits = ctx.editedFiles.filter((f) => /\.(tsx?|jsx?)$/.test(f));
      if (fired.length > 0) {
        return { label: "post-edit-convention", status: "pass", detail: `${fired.length}회 / ${tsxEdits.length}개 파일 편집` };
      }
      return { label: "post-edit-convention", status: "fail", detail: `${tsxEdits.length}개 TS/TSX 편집했으나 미발동` };
    },
  },
  {
    label: "Skill 호출",
    when: (ctx) => ctx.events.some((e) => e.event_type === "UserPromptSubmit" && e.prompt_text?.startsWith("/")),
    check: (ctx) => {
      if (ctx.skills.length > 0) {
        const names = ctx.skills
          .map((e) => e.tool_input_summary?.replace(/^skill:\s*/, "") ?? "unknown")
          .filter((n, i, arr) => arr.indexOf(n) === i);
        return { label: "Skill 호출", status: "pass", detail: names.join(", ") };
      }
      return { label: "Skill 호출", status: "warn", detail: "슬래시 명령 사용했으나 Skill 호출 없음" };
    },
  },
];

const STATUS_STYLE = {
  pass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  fail: "border-red-500/40 bg-red-500/10 text-red-400",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-400",
} as const;

const STATUS_ICON = { pass: "✓", fail: "✗", warn: "!" } as const;

export function PluginHealth({ events }: PluginHealthProps) {
  const ctx = useMemo(() => buildContext(events), [events]);

  const checks = useMemo(() => {
    const results: HealthCheck[] = [];
    for (const rule of EXPECT_RULES) {
      if (rule.when(ctx)) {
        results.push(rule.check(ctx));
      }
    }
    return results;
  }, [ctx]);

  // 발동된 hook 목록
  const hookSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of ctx.hooks) {
      const name = e.tool_name ?? "unknown";
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [ctx.hooks]);

  // 발동된 convention 목록 (raw_data에서 추출)
  const conventions = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of ctx.hooks) {
      if (!e.raw_data) continue;
      try {
        const data = JSON.parse(e.raw_data) as { injected_conventions?: string[]; target_file?: string };
        for (const conv of data.injected_conventions ?? []) {
          // 빈 문자열, 확장자만 있는 값(tsx, ts 등) 필터링 — 실제 파일명(.md 등)만 표시
          if (conv.length === 0 || !conv.includes(".")) continue;
          map.set(conv, (map.get(conv) ?? 0) + 1);
        }
      } catch { /* skip */ }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [ctx.hooks]);

  if (checks.length === 0 && hookSummary.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Plugin Health
      </h4>

      {/* 체크 결과 */}
      {checks.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {checks.map((c) => (
            <div
              key={c.label}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${STATUS_STYLE[c.status]}`}
            >
              <span className="font-bold text-sm">{STATUS_ICON[c.status]}</span>
              <span className="font-medium">{c.label}</span>
              <span className="text-[10px] opacity-80">— {c.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* 발동된 Hook 목록 */}
      {hookSummary.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] uppercase text-muted-foreground/60 mb-1">Hooks 발동</div>
          <div className="flex flex-wrap gap-1.5">
            {hookSummary.map(([name, count]) => (
              <Badge key={name} variant="outline" className="text-[10px]">
                {name} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 주입된 Convention 목록 */}
      {conventions.length > 0 && (
        <div>
          <div className="text-[10px] uppercase text-muted-foreground/60 mb-1">주입된 Conventions</div>
          <div className="flex flex-wrap gap-1.5">
            {conventions.map(([name, count]) => (
              <Badge key={name} variant="outline" className="text-[10px] text-violet-400 border-violet-500/40">
                {name} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
