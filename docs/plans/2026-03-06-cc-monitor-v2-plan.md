# cc-monitor v2 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** send-event.ts를 enrichment 수집기로 개선하고, 대시보드를 탭 기반으로 재구성한다.

**Architecture:** 로컬 hook(send-event.ts)이 경량 도구 카운팅 + transcript 파싱 + config 수집을 수행하여 enriched 데이터를 원격 서버에 전송. 서버는 저장만 담당. 대시보드는 Overview/Cost/Sessions/Config 4탭으로 분리.

**Tech Stack:** Next.js (Pages Router), Prisma + libSQL (Turso), TypeScript, Tailwind CSS

**설계 문서:** `docs/plans/2026-03-06-cc-monitor-v2-design.md`

---

## Phase 1: 수집 레이어 개선 (send-event.ts)

### Task 1: 경량 도구 카운터 파일 캐시

경량 도구(Read/Edit/Glob/Grep/Write)의 PreToolUse/PostToolUse 이벤트를 서버 전송 대신 로컬 파일 카운터로 집계한다.

**Files:**
- Create: `services/cc-monitor/collector/tool-counter.ts`
- Modify: `services/cc-monitor/collector/send-event.ts`

**Step 1: tool-counter.ts 생성**

```typescript
// services/cc-monitor/collector/tool-counter.ts
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const LIGHT_TOOLS = new Set(["Read", "Edit", "Glob", "Grep", "Write"]);

export function isLightTool(toolName: string): boolean {
  return LIGHT_TOOLS.has(toolName);
}

function getCachePath(sessionId: string): string {
  return path.join(os.tmpdir(), `cc-monitor-${sessionId}.json`);
}

export function incrementCounter(sessionId: string, toolName: string): void {
  const cachePath = getCachePath(sessionId);
  let counters: Record<string, number> = {};

  try {
    if (fs.existsSync(cachePath)) {
      counters = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    }
  } catch {
    counters = {};
  }

  counters[toolName] = (counters[toolName] ?? 0) + 1;
  fs.writeFileSync(cachePath, JSON.stringify(counters), "utf-8");
}

export function readAndClearCounters(sessionId: string): Record<string, number> | null {
  const cachePath = getCachePath(sessionId);
  try {
    if (!fs.existsSync(cachePath)) return null;
    const counters = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    fs.unlinkSync(cachePath);
    return counters;
  } catch {
    return null;
  }
}
```

**Step 2: send-event.ts에 경량 도구 분기 추가**

`send-event.ts`에서:
- PreToolUse/PostToolUse + 경량 도구 → `incrementCounter()` 호출, 서버 전송 안 함
- 그 외 → 기존대로 서버 전송

```typescript
// send-event.ts 수정 핵심 부분
import { isLightTool, incrementCounter, readAndClearCounters } from "./tool-counter.ts";

// ... 기존 main() 내부 ...
const eventName = event.hook_event_name as string;
const toolName = (event as Record<string, unknown>).tool_name as string | undefined;

// 경량 도구는 카운터만 증가, 서버 전송 안 함
if ((eventName === "PreToolUse" || eventName === "PostToolUse") && toolName && isLightTool(toolName)) {
  if (eventName === "PostToolUse") {
    incrementCounter(event.session_id as string, toolName);
  }
  process.exit(0);
}

// Stop/SessionEnd 시 카운터 요약 포함
if (eventName === "Stop" || eventName === "SessionEnd") {
  const toolSummary = readAndClearCounters(event.session_id as string);
  if (toolSummary) {
    (event as Record<string, unknown>).tool_summary = toolSummary;
  }
}
```

**Step 3: 테스트 — 로컬에서 경량 도구 이벤트 전송 시 서버 호출 안 되는지 확인**

```bash
echo '{"session_id":"test-123","hook_event_name":"PostToolUse","tool_name":"Read","tool_input":{"file_path":"/tmp/test"},"cwd":"/tmp"}' | CC_MONITOR_URL=http://localhost:4000 node services/cc-monitor/collector/send-event.ts
# 확인: /tmp/cc-monitor-test-123.json에 {"Read":1} 저장됨
cat /tmp/cc-monitor-test-123.json
```

**Step 4: 커밋**

```bash
git add services/cc-monitor/collector/tool-counter.ts services/cc-monitor/collector/send-event.ts
git commit -m "feat(cc-monitor): 경량 도구 카운터 파일 캐시 구현"
```

---

### Task 2: transcript 파싱을 send-event.ts로 이동

Stop/SessionEnd 시 send-event.ts가 로컬에서 transcript를 파싱하여 토큰 정보를 서버에 전송한다.

**Files:**
- Create: `services/cc-monitor/collector/transcript-reader.ts`
- Modify: `services/cc-monitor/collector/send-event.ts`
- Modify: `services/cc-monitor/src/pages/api/events.ts` (서버측 transcript 파싱 제거)

**Step 1: transcript-reader.ts 생성**

기존 `src/lib/transcript-parser.ts` 로직을 재사용하되 collector에 독립 모듈로 작성.

```typescript
// services/cc-monitor/collector/transcript-reader.ts
import fs from "node:fs";
import readline from "node:readline";
import os from "node:os";

export interface TranscriptUsage {
  input_tokens: number;
  output_tokens: number;
  cache_create_tokens: number;
  cache_read_tokens: number;
  num_turns: number;
}

export async function parseTranscriptUsage(
  transcriptPath: string
): Promise<TranscriptUsage | null> {
  const resolved = transcriptPath.startsWith("~")
    ? transcriptPath.replace("~", os.homedir())
    : transcriptPath;

  if (!fs.existsSync(resolved)) return null;

  const result: TranscriptUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_create_tokens: 0,
    cache_read_tokens: 0,
    num_turns: 0,
  };

  const rl = readline.createInterface({
    input: fs.createReadStream(resolved, "utf-8"),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === "assistant" && obj.message?.usage) {
        const u = obj.message.usage;
        result.input_tokens += u.input_tokens ?? 0;
        result.output_tokens += u.output_tokens ?? 0;
        result.cache_create_tokens += u.cache_creation_input_tokens ?? 0;
        result.cache_read_tokens += u.cache_read_input_tokens ?? 0;
        result.num_turns += 1;
      }
    } catch {
      // skip
    }
  }

  return result;
}
```

**Step 2: send-event.ts에 transcript 파싱 추가**

```typescript
// send-event.ts Stop/SessionEnd 처리 부분
import { parseTranscriptUsage } from "./transcript-reader.ts";

if (eventName === "Stop" || eventName === "SessionEnd") {
  const transcriptPath = (event as Record<string, unknown>).transcript_path as string | undefined;
  if (transcriptPath) {
    const usage = await parseTranscriptUsage(transcriptPath);
    if (usage) {
      (event as Record<string, unknown>).transcript_usage = usage;
    }
  }
}
```

**Step 3: 서버 events.ts에서 transcript 파싱 제거**

`src/pages/api/events.ts`에서 `parseTranscriptUsage` import와 관련 로직 삭제. 대신 `event.transcript_usage`를 직접 사용하여 `updateSessionTokens` 호출.

```typescript
// events.ts Stop 처리 부분 변경
if (event.hook_event_name === "Stop") {
  const transcriptPath = "transcript_path" in event ? event.transcript_path : null;
  if (transcriptPath) {
    await upsertSession({ session_id: event.session_id, transcript_path: transcriptPath as string });
  }
  // 클라이언트(send-event.ts)에서 파싱한 토큰 사용
  const usage = "transcript_usage" in event ? event.transcript_usage as { input_tokens: number; output_tokens: number; cache_create_tokens: number; cache_read_tokens: number; num_turns: number } : null;
  if (usage) {
    await updateSessionTokens(event.session_id, {
      total_input_tokens: usage.input_tokens,
      total_output_tokens: usage.output_tokens,
      total_cache_create_tokens: usage.cache_create_tokens,
      total_cache_read_tokens: usage.cache_read_tokens,
      num_turns: usage.num_turns,
    });
  }
}
```

**Step 4: 커밋**

```bash
git add services/cc-monitor/collector/transcript-reader.ts services/cc-monitor/collector/send-event.ts services/cc-monitor/src/pages/api/events.ts
git commit -m "feat(cc-monitor): transcript 파싱을 collector로 이동"
```

---

### Task 3: config 수집 (SessionStart enrichment)

SessionStart 시 send-event.ts가 로컬 파일시스템에서 CLAUDE.md, rules, MCP, hooks 정보를 수집하여 전송.

**Files:**
- Create: `services/cc-monitor/collector/config-reader.ts`
- Modify: `services/cc-monitor/collector/send-event.ts`

**Step 1: config-reader.ts 생성**

claude-hud의 `config-reader.ts` 로직 참고하여 간소화된 버전 작성.

```typescript
// services/cc-monitor/collector/config-reader.ts
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ConfigSnapshot {
  claude_md_count: number;
  claude_md_paths: string[];
  rules_count: number;
  rules_names: string[];
  mcp_count: number;
  mcp_names: string[];
  hooks_count: number;
  hooks_events: string[];
}

export function collectConfig(cwd: string): ConfigSnapshot {
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, ".claude");
  const result: ConfigSnapshot = {
    claude_md_count: 0,
    claude_md_paths: [],
    rules_count: 0,
    rules_names: [],
    mcp_count: 0,
    mcp_names: [],
    hooks_count: 0,
    hooks_events: [],
  };

  // CLAUDE.md 파일들
  const claudeMdCandidates = [
    path.join(claudeDir, "CLAUDE.md"),
    path.join(cwd, "CLAUDE.md"),
    path.join(cwd, "CLAUDE.local.md"),
    path.join(cwd, ".claude", "CLAUDE.md"),
    path.join(cwd, ".claude", "CLAUDE.local.md"),
  ];
  for (const p of claudeMdCandidates) {
    if (fs.existsSync(p)) {
      result.claude_md_count++;
      result.claude_md_paths.push(p.replace(homeDir, "~"));
    }
  }

  // rules
  for (const rulesDir of [path.join(claudeDir, "rules"), path.join(cwd, ".claude", "rules")]) {
    if (fs.existsSync(rulesDir)) {
      const files = collectMdFiles(rulesDir);
      result.rules_count += files.length;
      result.rules_names.push(...files);
    }
  }

  // MCP servers
  for (const mcpFile of [
    path.join(claudeDir, "settings.json"),
    path.join(homeDir, ".claude.json"),
    path.join(cwd, ".mcp.json"),
    path.join(cwd, ".claude", "settings.json"),
    path.join(cwd, ".claude", "settings.local.json"),
  ]) {
    const names = readJsonKey(mcpFile, "mcpServers");
    result.mcp_names.push(...names);
  }
  result.mcp_names = [...new Set(result.mcp_names)];
  result.mcp_count = result.mcp_names.length;

  // Hooks
  for (const settingsFile of [
    path.join(claudeDir, "settings.json"),
    path.join(cwd, ".claude", "settings.json"),
    path.join(cwd, ".claude", "settings.local.json"),
  ]) {
    const events = readJsonKey(settingsFile, "hooks");
    for (const e of events) {
      if (!result.hooks_events.includes(e)) result.hooks_events.push(e);
    }
  }
  result.hooks_count = result.hooks_events.length;

  return result;
}

function collectMdFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        results.push(...collectMdFiles(path.join(dir, entry.name)));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(entry.name);
      }
    }
  } catch { /* ignore */ }
  return results;
}

function readJsonKey(filePath: string, key: string): string[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const obj = content[key];
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return Object.keys(obj);
    }
  } catch { /* ignore */ }
  return [];
}
```

**Step 2: send-event.ts SessionStart에 config 추가**

```typescript
import { collectConfig } from "./config-reader.ts";

if (eventName === "SessionStart") {
  const cwd = (event as Record<string, unknown>).cwd as string;
  if (cwd) {
    (event as Record<string, unknown>).config_snapshot = collectConfig(cwd);
  }
}
```

**Step 3: 커밋**

```bash
git add services/cc-monitor/collector/config-reader.ts services/cc-monitor/collector/send-event.ts
git commit -m "feat(cc-monitor): SessionStart config 수집 추가"
```

---

## Phase 2: 서버 스키마 + API 변경

### Task 4: Prisma 스키마 업데이트

Session 테이블에 config/tool_summary 컬럼 추가.

**Files:**
- Modify: `services/cc-monitor/prisma/schema.prisma`

**Step 1: schema.prisma Session 모델에 컬럼 추가**

```prisma
model Session {
  // ... 기존 필드 유지 ...

  // v2: config snapshot
  config_claude_md_count    Int?
  config_rules_count        Int?
  config_mcp_count          Int?
  config_hooks_count        Int?
  config_mcp_names          String?   // JSON array
  config_rules_names        String?   // JSON array
  config_claude_md_paths    String?   // JSON array
  config_hooks_events       String?   // JSON array
  // v2: tool summary
  tool_summary              String?   // JSON: {"Read": 42, "Edit": 8}
}
```

**Step 2: db push**

```bash
cd services/cc-monitor && pnpm prisma db push
```

**Step 3: 커밋**

```bash
git add services/cc-monitor/prisma/schema.prisma
git commit -m "feat(cc-monitor): Session 스키마에 config/tool_summary 컬럼 추가"
```

---

### Task 5: events.ts API에서 config_snapshot, tool_summary 처리

서버가 enriched 이벤트의 config_snapshot, tool_summary를 Session에 저장.

**Files:**
- Modify: `services/cc-monitor/src/pages/api/events.ts`
- Modify: `services/cc-monitor/src/lib/queries.ts` (upsertSession 확장)

**Step 1: events.ts SessionStart에서 config_snapshot 저장**

```typescript
if (event.hook_event_name === "SessionStart") {
  const config = "config_snapshot" in event ? event.config_snapshot as Record<string, unknown> : null;
  await upsertSession({
    session_id: event.session_id,
    user_id: userId,
    project_path: event.cwd,
    model: "model" in event ? event.model as string : null,
    permission_mode: event.permission_mode ?? null,
    started_at: stored.timestamp,
    status: "active",
    // v2 config
    ...(config ? {
      config_claude_md_count: config.claude_md_count as number,
      config_rules_count: config.rules_count as number,
      config_mcp_count: config.mcp_count as number,
      config_hooks_count: config.hooks_count as number,
      config_mcp_names: JSON.stringify(config.mcp_names),
      config_rules_names: JSON.stringify(config.rules_names),
      config_claude_md_paths: JSON.stringify(config.claude_md_paths),
      config_hooks_events: JSON.stringify(config.hooks_events),
    } : {}),
  });
}
```

**Step 2: Stop/SessionEnd에서 tool_summary 저장**

```typescript
if (event.hook_event_name === "Stop" || event.hook_event_name === "SessionEnd") {
  const toolSummary = "tool_summary" in event ? event.tool_summary : null;
  if (toolSummary) {
    await upsertSession({
      session_id: event.session_id,
      tool_summary: JSON.stringify(toolSummary),
    });
  }
}
```

**Step 3: queries.ts upsertSession에 새 필드 타입 추가**

upsertSession의 파라미터 타입에 새 컬럼들 추가 (optional).

**Step 4: 커밋**

```bash
git add services/cc-monitor/src/pages/api/events.ts services/cc-monitor/src/lib/queries.ts
git commit -m "feat(cc-monitor): enriched 이벤트의 config/tool_summary 서버 저장"
```

---

## Phase 3: 대시보드 탭 재구성

### Task 6: 탭 레이아웃 + Overview 탭

기존 단일 페이지를 탭 기반으로 재구성. shadcn Tabs 대신 간단한 커스텀 탭 (의존성 추가 최소화).

**Files:**
- Create: `services/cc-monitor/src/components/TabNav.tsx`
- Modify: `services/cc-monitor/src/pages/index.tsx`

**Step 1: TabNav 컴포넌트 생성**

```typescript
// services/cc-monitor/src/components/TabNav.tsx
interface TabNavProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
```

**Step 2: index.tsx를 탭 구조로 리팩토링**

- 탭: Overview, Cost, Sessions, Config
- Overview: ActiveSessions + HourlyActivity + ToolUsageChart (경량도구 요약 포함) + TokenUsage
- Cost: CostTracking (기존 컴포넌트)
- Sessions: 기존 ActivityFeed + 세션 목록 (추후 세션 상세)
- Config: 새 컴포넌트 (Task 8에서 구현)

**Step 3: 커밋**

```bash
git add services/cc-monitor/src/components/TabNav.tsx services/cc-monitor/src/pages/index.tsx
git commit -m "feat(cc-monitor): 대시보드 탭 레이아웃 구현"
```

---

### Task 7: Cost 탭 분리

기존 CostTracking을 Cost 탭으로 이동. 추가로 사용자별 비용 순위 추가.

**Files:**
- Modify: `services/cc-monitor/src/pages/index.tsx` (Cost 탭 영역)

별도 파일 생성 불필요 — 기존 CostTracking 컴포넌트를 Cost 탭에 배치하면 됨.

**Step 1: Cost 탭 내 CostTracking + UserSummary 배치**

**Step 2: 커밋**

```bash
git add services/cc-monitor/src/pages/index.tsx
git commit -m "feat(cc-monitor): Cost 탭 분리"
```

---

### Task 8: Config 탭 구현

사용자별 설정 현황을 보여주는 새 컴포넌트.

**Files:**
- Create: `services/cc-monitor/src/components/ConfigOverview.tsx`
- Create: `services/cc-monitor/src/pages/api/config.ts`
- Modify: `services/cc-monitor/src/lib/queries.ts` (getSessionConfigs 쿼리 추가)

**Step 1: API — 사용자별 최근 세션의 config_snapshot 조회**

```typescript
// GET /api/config
// 각 사용자의 가장 최근 세션에서 config 정보를 가져옴
// Response: { configs: [{ user_id, config_claude_md_count, config_mcp_names, ... }] }
```

**Step 2: queries.ts에 getSessionConfigs 추가**

```typescript
export async function getSessionConfigs(): Promise<Array<{
  user_id: string;
  config_claude_md_count: number | null;
  config_rules_count: number | null;
  config_mcp_count: number | null;
  config_hooks_count: number | null;
  config_mcp_names: string | null;
  config_rules_names: string | null;
  config_claude_md_paths: string | null;
  config_hooks_events: string | null;
  started_at: string;
}>> {
  // 각 user_id별 가장 최근 세션의 config 정보
}
```

**Step 3: ConfigOverview 컴포넌트**

- 사용자별 카드/테이블
- MCP 서버 목록, rules 목록, hooks 이벤트
- "팀에서 X%가 Y MCP를 사용 중" 같은 채택률 표시

**Step 4: 커밋**

```bash
git add services/cc-monitor/src/components/ConfigOverview.tsx services/cc-monitor/src/pages/api/config.ts services/cc-monitor/src/lib/queries.ts
git commit -m "feat(cc-monitor): Config 탭 구현"
```

---

### Task 9: Sessions 탭 + prompt-logs 통합

기존 prompt-logs 페이지를 Sessions 탭 내 세션 상세로 통합.

**Files:**
- Modify: `services/cc-monitor/src/pages/index.tsx` (Sessions 탭)
- Delete: `services/cc-monitor/src/pages/prompt-logs.tsx` (통합 후 제거)

**Step 1: Sessions 탭에 세션 목록 표시 (기존 ActiveSessions 재사용)**

**Step 2: 세션 클릭 시 인라인 상세 — tool_summary + prompt logs 표시**

**Step 3: prompt-logs.tsx 삭제**

**Step 4: 커밋**

```bash
git add services/cc-monitor/src/pages/index.tsx
git rm services/cc-monitor/src/pages/prompt-logs.tsx
git commit -m "refactor(cc-monitor): Sessions 탭에 prompt-logs 통합"
```

---

## Phase 4: 정리

### Task 10: mock-data 업데이트 + 불필요 컴포넌트 정리

Demo Mode mock 데이터에 새 필드 추가. 사용하지 않는 Adoption 컴포넌트 정리.

**Files:**
- Modify: `services/cc-monitor/src/lib/mock-data.ts`
- Delete: `services/cc-monitor/src/components/AdoptionSummaryCards.tsx`
- Delete: `services/cc-monitor/src/components/AdoptionTrendChart.tsx`
- Delete: `services/cc-monitor/src/components/ToolAdoptionChart.tsx`
- Modify: `services/cc-monitor/src/lib/types.ts` (정리)

**Step 1: mock-data에 config_snapshot, tool_summary 추가**

**Step 2: 사용하지 않는 Adoption 컴포넌트 삭제**

**Step 3: 빌드 확인**

```bash
cd services/cc-monitor && pnpm build
```

**Step 4: 커밋**

```bash
git add -A services/cc-monitor/
git commit -m "chore(cc-monitor): v2 mock data 업데이트 + 미사용 컴포넌트 정리"
```

---

### Task 11: hooks-config.example.json 업데이트

경량 도구 필터링 설명 추가 및 설치 가이드 업데이트.

**Files:**
- Modify: `services/cc-monitor/collector/hooks-config.example.json`

**Step 1: 예시 설정 업데이트 (변경 사항 없지만 주석/README 업데이트)**

hook 설정 자체는 동일 (모든 이벤트를 보내되, send-event.ts가 경량 도구를 필터링).

**Step 2: 커밋**

```bash
git add services/cc-monitor/collector/hooks-config.example.json
git commit -m "docs(cc-monitor): hooks 설정 가이드 업데이트"
```

---

## 실행 순서 요약

| Phase | Task | 내용 | 의존성 |
|-------|------|------|--------|
| 1 | Task 1 | 경량 도구 카운터 | 없음 |
| 1 | Task 2 | transcript 파싱 이동 | 없음 |
| 1 | Task 3 | config 수집 | 없음 |
| 2 | Task 4 | Prisma 스키마 업데이트 | 없음 |
| 2 | Task 5 | events.ts enriched 처리 | Task 4 |
| 3 | Task 6 | 탭 레이아웃 + Overview | Task 4, 5 |
| 3 | Task 7 | Cost 탭 | Task 6 |
| 3 | Task 8 | Config 탭 | Task 5, 6 |
| 3 | Task 9 | Sessions 탭 + prompt-logs 통합 | Task 6 |
| 4 | Task 10 | mock data + 정리 | Task 6-9 |
| 4 | Task 11 | hooks config 업데이트 | Task 1-3 |

**병렬 가능**: Task 1, 2, 3은 독립적으로 병렬 실행 가능. Task 6-9도 탭별로 병렬 가능.
