# cc-monitor Phase 2: 이벤트 타임라인 필터링 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 세션 상세 이벤트 타임라인에 도구 타입별 멀티 필터링, 도구명 툴팁, AskUserQuestion 수집 확대를 추가한다.

**Architecture:** 프론트엔드 필터링 (이벤트는 이미 전체 로드). 도구 카테고리 매핑 함수 + 정적 설명 데이터를 별도 모듈로 분리. AskUserQuestion은 event-processor.ts에서 tool_input_summary에 질문 텍스트를 저장하도록 수정.

**Tech Stack:** Next.js Pages Router, shadcn/ui (Badge, Tooltip), TypeScript

**주요 파일 참조:**
- `services/cc-monitor/src/components/SessionsTab.tsx` (495줄) — 타임라인: 308-337, import: 1-6, eventTypeColor: 44-49
- `services/cc-monitor/src/lib/event-processor.ts` (99줄) — summarizeToolInput 함수
- `services/cc-monitor/src/lib/mock-data.ts` — mockEvents
- `services/cc-monitor/src/lib/types.ts` — StoredEvent, HookEventName
- `services/cc-monitor/src/components/ui/` — badge, button, card, separator (Tooltip 없음)

---

## Task 1: tool-categories.ts 생성

**Files:**
- Create: `services/cc-monitor/src/lib/tool-categories.ts`

**Step 1: 파일 생성**

```typescript
export type ToolCategory =
  | "Skill"
  | "Agent"
  | "Bash"
  | "File"
  | "Search"
  | "MCP"
  | "Prompt"
  | "Session"
  | "Question";

const TOOL_TO_CATEGORY: Record<string, ToolCategory> = {
  Skill: "Skill",
  Agent: "Agent",
  Bash: "Bash",
  Read: "File",
  Edit: "File",
  Write: "File",
  NotebookEdit: "File",
  Grep: "Search",
  Glob: "Search",
  ToolSearch: "Search",
  AskUserQuestion: "Question",
};

const EVENT_TYPE_CATEGORIES: Record<string, ToolCategory> = {
  UserPromptSubmit: "Prompt",
  SessionStart: "Session",
  SessionEnd: "Session",
  Stop: "Session",
  PreCompact: "Session",
  SubagentStart: "Agent",
  SubagentStop: "Agent",
};

export function getToolCategory(
  toolName: string | null,
  eventType: string
): ToolCategory {
  // 이벤트 타입 기반 (도구가 없는 이벤트)
  if (!toolName || eventType in EVENT_TYPE_CATEGORIES) {
    return EVENT_TYPE_CATEGORIES[eventType] ?? "Session";
  }
  // MCP 도구 (mcp__ prefix)
  if (toolName.startsWith("mcp__")) return "MCP";
  // 정적 매핑
  return TOOL_TO_CATEGORY[toolName] ?? "Bash";
}

export const CATEGORY_COLORS: Record<ToolCategory, string> = {
  Skill: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Agent: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Bash: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  File: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Search: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  MCP: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  Prompt: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Session: "bg-red-500/20 text-red-400 border-red-500/30",
  Question: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export const ALL_CATEGORIES: ToolCategory[] = [
  "Skill",
  "Agent",
  "Bash",
  "File",
  "Search",
  "MCP",
  "Prompt",
  "Session",
  "Question",
];
```

**Step 2: 빌드 확인**

Run: `cd services/cc-monitor && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음 (아직 import 안 함)

**Step 3: 커밋**

```bash
git add services/cc-monitor/src/lib/tool-categories.ts
git commit -m "feat(cc-monitor): 도구 타입 카테고리 매핑 모듈 추가"
```

---

## Task 2: tool-descriptions.ts 생성

**Files:**
- Create: `services/cc-monitor/src/lib/tool-descriptions.ts`

**Step 1: 파일 생성**

```typescript
const TOOL_DESCRIPTIONS: Record<string, string> = {
  // Meta
  ToolSearch: "사용 가능한 deferred 도구를 검색/로드하는 메타 도구",
  // Interaction
  AskUserQuestion: "사용자에게 선택지를 제시하고 답변을 받는 도구",
  Skill: "등록된 스킬(slash command)을 실행",
  Agent: "독립 서브에이전트를 생성하여 병렬 작업 수행",
  // Shell
  Bash: "쉘 명령어 실행 (timeout 2분, background 가능)",
  // File
  Read: "파일 읽기 (이미지, PDF, 노트북 지원)",
  Edit: "파일 부분 수정 (문자열 치환 방식)",
  Write: "파일 생성 또는 전체 덮어쓰기",
  NotebookEdit: "Jupyter 노트북 셀 편집",
  // Search
  Grep: "파일 내용 검색 (정규식 지원)",
  Glob: "파일명 패턴 매칭 검색",
  // Plan
  EnterPlanMode: "Plan Mode 진입 (읽기 전용 탐색)",
  ExitPlanMode: "Plan Mode 종료",
  // Task
  TaskCreate: "백그라운드 태스크 생성",
  TaskUpdate: "태스크 상태 업데이트",
  // Web
  WebFetch: "URL에서 콘텐츠 가져오기",
  WebSearch: "웹 검색 수행",
};

export function getToolDescription(toolName: string): string {
  // 정적 매핑
  if (TOOL_DESCRIPTIONS[toolName]) return TOOL_DESCRIPTIONS[toolName];
  // MCP 도구: mcp__{provider}__{tool} → "MCP: provider / tool"
  if (toolName.startsWith("mcp__")) {
    const parts = toolName.replace("mcp__", "").split("__");
    if (parts.length >= 2) {
      return `MCP: ${parts[0]} / ${parts.slice(1).join("__")}`;
    }
    return `MCP: ${parts[0]}`;
  }
  return toolName;
}
```

**Step 2: 커밋**

```bash
git add services/cc-monitor/src/lib/tool-descriptions.ts
git commit -m "feat(cc-monitor): 도구 설명 정적 데이터 모듈 추가"
```

---

## Task 3: Tooltip UI 컴포넌트 추가

**Files:**
- Create: `services/cc-monitor/src/components/ui/tooltip.tsx`

**Step 1: shadcn tooltip 설치 또는 수동 생성**

Run: `cd services/cc-monitor && npx shadcn@latest add tooltip 2>&1 | tail -5`

- 실패 시 수동으로 `@radix-ui/react-tooltip` 설치 후 컴포넌트 작성
- Run: `cd services/cc-monitor && pnpm add @radix-ui/react-tooltip`

**Step 2: _app.tsx에 TooltipProvider 래핑**

Modify: `services/cc-monitor/src/pages/_app.tsx`

`<TooltipProvider>` 로 앱 전체 래핑:

```tsx
import { TooltipProvider } from "@/components/ui/tooltip";

// return 부분에서:
<TooltipProvider delayDuration={300}>
  <Component {...pageProps} />
</TooltipProvider>
```

**Step 3: 빌드 확인**

Run: `cd services/cc-monitor && pnpm build 2>&1 | tail -10`
Expected: 빌드 성공

**Step 4: 커밋**

```bash
git add services/cc-monitor/src/components/ui/tooltip.tsx services/cc-monitor/src/pages/_app.tsx services/cc-monitor/package.json services/cc-monitor/pnpm-lock.yaml
git commit -m "feat(cc-monitor): Tooltip UI 컴포넌트 추가"
```

---

## Task 4: SessionsTab에 멀티 필터링 UI 적용

**Files:**
- Modify: `services/cc-monitor/src/components/SessionsTab.tsx`

**Step 1: import 추가 (1-6줄)**

기존 import에 추가:

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getToolCategory, CATEGORY_COLORS, ALL_CATEGORIES, type ToolCategory } from "@/lib/tool-categories";
import { getToolDescription } from "@/lib/tool-descriptions";
```

**Step 2: SessionDrawer에 필터 상태 추가 (182줄 근처, 컴포넌트 내부)**

SessionDrawer 컴포넌트 내부에 상태 추가:

```tsx
const [selectedCategories, setSelectedCategories] = useState<Set<ToolCategory>>(
  new Set(ALL_CATEGORIES)
);

const toggleCategory = (cat: ToolCategory) => {
  setSelectedCategories((prev) => {
    const next = new Set(prev);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    return next;
  });
};

const selectAll = () => setSelectedCategories(new Set(ALL_CATEGORIES));
const clearAll = () => setSelectedCategories(new Set());
```

**Step 3: 이벤트 필터링 + 카테고리별 카운트 로직**

```tsx
const categoryCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const ev of events) {
    const cat = getToolCategory(ev.tool_name, ev.event_type);
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}, [events]);

const filteredEvents = useMemo(
  () => events.filter((ev) => selectedCategories.has(getToolCategory(ev.tool_name, ev.event_type))),
  [events, selectedCategories]
);
```

`useMemo` import 필요 — 기존 `useState, useEffect, useCallback`에 추가.

**Step 4: 필터 배지 UI 렌더링 (타임라인 제목 아래, 308줄 근처)**

```tsx
{/* 필터 배지 */}
<div className="mb-2 flex flex-wrap items-center gap-1">
  <button
    onClick={selectAll}
    className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
  >
    All
  </button>
  <button
    onClick={clearAll}
    className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
  >
    Clear
  </button>
  <span className="mx-1 h-3 w-px bg-border" />
  {ALL_CATEGORIES.map((cat) => (
    <button
      key={cat}
      onClick={() => toggleCategory(cat)}
      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium transition-opacity ${
        CATEGORY_COLORS[cat]
      } ${selectedCategories.has(cat) ? "opacity-100" : "opacity-30"}`}
    >
      {cat} {categoryCounts[cat] ? `(${categoryCounts[cat]})` : ""}
    </button>
  ))}
</div>
```

**Step 5: 이벤트 목록을 filteredEvents로 교체**

기존 `events.map((ev) =>` → `filteredEvents.map((ev) =>`

타임라인 헤더의 카운트도 변경:
`(${events.length})` → `(${filteredEvents.length}/${events.length})`

**Step 6: 빌드 확인**

Run: `cd services/cc-monitor && pnpm build 2>&1 | tail -10`
Expected: 빌드 성공

**Step 7: 커밋**

```bash
git add services/cc-monitor/src/components/SessionsTab.tsx
git commit -m "feat(cc-monitor): 이벤트 타임라인 멀티 필터링 UI 추가"
```

---

## Task 5: 도구명 툴팁 적용

**Files:**
- Modify: `services/cc-monitor/src/components/SessionsTab.tsx`

**Step 1: 타임라인의 도구명 부분에 Tooltip 래핑 (325줄 근처)**

기존:
```tsx
{ev.tool_name && <span className="font-mono text-foreground/80">{ev.tool_name}</span>}
```

변경:
```tsx
{ev.tool_name && (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="cursor-help font-mono text-foreground/80 underline decoration-dotted underline-offset-2">
        {ev.tool_name}
      </span>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs text-xs">
      {getToolDescription(ev.tool_name)}
    </TooltipContent>
  </Tooltip>
)}
```

**Step 2: 카테고리 배지도 eventTypeColor 대신 카테고리 색상 사용**

기존:
```tsx
<Badge variant={eventTypeColor(ev.event_type)} className="text-[10px]">
  {ev.event_type}
</Badge>
```

변경:
```tsx
<span className={`inline-flex shrink-0 rounded border px-1 py-0.5 text-[10px] font-medium ${
  CATEGORY_COLORS[getToolCategory(ev.tool_name, ev.event_type)]
}`}>
  {ev.tool_name ?? ev.event_type}
</span>
```

**Step 3: 빌드 확인**

Run: `cd services/cc-monitor && pnpm build 2>&1 | tail -10`

**Step 4: 커밋**

```bash
git add services/cc-monitor/src/components/SessionsTab.tsx
git commit -m "feat(cc-monitor): 도구명 툴팁 + 카테고리 색상 배지 적용"
```

---

## Task 6: AskUserQuestion 수집 확대

**Files:**
- Modify: `services/cc-monitor/src/lib/event-processor.ts` (summarizeToolInput 함수)

**Step 1: AskUserQuestion 케이스 추가**

`summarizeToolInput` 함수 내에 AskUserQuestion 전용 분기 추가:

```typescript
case "AskUserQuestion": {
  const questions = input?.questions;
  if (Array.isArray(questions) && questions.length > 0) {
    const first = questions[0];
    const q = first?.question ?? "";
    return `Q: ${q.slice(0, 100)}${q.length > 100 ? "..." : ""}`;
  }
  return "AskUserQuestion";
}
```

**Step 2: send-event.ts에서 AskUserQuestion이 경량 도구 목록에 없는지 확인**

- `isLightTool` 함수에 AskUserQuestion이 포함되어 있으면 제거 (API로 전송되어야 함)
- 현재 경량 도구: Read, Edit, Write, Glob, Bash 등 → AskUserQuestion은 이미 API 전송 대상

**Step 3: 빌드 확인**

Run: `cd services/cc-monitor && pnpm build 2>&1 | tail -10`

**Step 4: 커밋**

```bash
git add services/cc-monitor/src/lib/event-processor.ts
git commit -m "feat(cc-monitor): AskUserQuestion 질문 텍스트 수집 추가"
```

---

## Task 7: mock-data 업데이트

**Files:**
- Modify: `services/cc-monitor/src/lib/mock-data.ts`

**Step 1: AskUserQuestion 이벤트 추가**

mockEvents 배열에 추가:

```typescript
{
  id: 6,
  session_id: "session-001",
  event_type: "PostToolUse" as const,
  user_id: "alice",
  project_path: "/Users/alice/projects/web-app",
  tool_name: "AskUserQuestion",
  tool_input_summary: "Q: 이벤트 타임라인 필터링 UI를 어떤 형태로 원하시나요?",
  model: "claude-sonnet-4-5-20250514",
  prompt_text: null,
  permission_mode: "default",
  tool_use_id: "toolu_ask_001",
  tool_duration_ms: 15200,
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  raw_data: null,
},
{
  id: 7,
  session_id: "session-001",
  event_type: "PostToolUse" as const,
  user_id: "alice",
  project_path: "/Users/alice/projects/web-app",
  tool_name: "Skill",
  tool_input_summary: "brainstorming — cc-monitor Phase 2 기능 스펙 정리",
  model: "claude-sonnet-4-5-20250514",
  prompt_text: null,
  permission_mode: "default",
  tool_use_id: "toolu_skill_001",
  tool_duration_ms: 820,
  timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
  raw_data: null,
},
{
  id: 8,
  session_id: "session-002",
  event_type: "PostToolUse" as const,
  user_id: "bob",
  project_path: "/Users/bob/projects/api-server",
  tool_name: "Agent",
  tool_input_summary: "Explore — 프로젝트 구조 파악",
  model: "claude-sonnet-4-5-20250514",
  prompt_text: null,
  permission_mode: "default",
  tool_use_id: "toolu_agent_001",
  tool_duration_ms: 12400,
  timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  raw_data: null,
},
```

**Step 2: mockToolUsageStats에 새 도구 추가**

```typescript
{ tool_name: "AskUserQuestion", count: 12, percentage: 2.5 },
{ tool_name: "Skill", count: 18, percentage: 3.7 },
{ tool_name: "Agent", count: 8, percentage: 1.6 },
{ tool_name: "ToolSearch", count: 24, percentage: 4.9 },
```

**Step 3: 빌드 확인**

Run: `cd services/cc-monitor && pnpm build 2>&1 | tail -10`

**Step 4: 커밋**

```bash
git add services/cc-monitor/src/lib/mock-data.ts
git commit -m "feat(cc-monitor): mock-data에 AskUserQuestion/Skill/Agent 이벤트 추가"
```

---

## Task 8: 최종 검증

**Step 1: 전체 빌드**

Run: `cd services/cc-monitor && pnpm build`
Expected: 빌드 성공

**Step 2: 로컬 실행 확인**

Run: `cd services/cc-monitor && pnpm dev`
- 브라우저에서 http://localhost:4000
- Sessions 탭 → 세션 클릭 → 드로어 열기
- 확인사항:
  - 필터 배지 표시 + 토글 동작
  - 도구명 호버 시 툴팁 표시
  - All/Clear 버튼 동작
  - 카테고리별 카운트 표시

**Step 3: 최종 커밋**

빌드 에러 수정이 있었다면 커밋.
