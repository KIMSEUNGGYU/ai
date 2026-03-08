# cc-monitor 컨벤션 리팩토링 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** cc-monitor의 서버/프론트 코드를 FE 컨벤션 기술스택에 맞춰 리팩토링

**Architecture:** useEffect+fetch 패턴을 Tanstack Query로 전환, raw fetch를 Ky로 교체, 인라인 스타일을 Tailwind로 변환, 타입 시스템 정리

**Tech Stack:** Tanstack Query, Suspensive, Ky, Zod, es-toolkit, Tailwind CSS (기존 유지)

---

## Task 1: 의존성 설치

**Files:**
- Modify: `services/cc-monitor/package.json`

**Step 1: 패키지 설치**

```bash
cd services/cc-monitor
pnpm add @tanstack/react-query ky zod es-toolkit @suspensive/react
```

**Step 2: 커밋**

```bash
git add services/cc-monitor/package.json pnpm-lock.yaml
git commit -m "chore(cc-monitor): Tanstack Query, Ky, Zod, es-toolkit, Suspensive 설치"
```

---

## Task 2: API 클라이언트 (Ky) + Zod 응답 스키마

기존 raw fetch 호출을 Ky 기반 API 클라이언트로 교체. Zod로 응답 타입 검증.

**Files:**
- Create: `src/lib/api-client.ts` — Ky 인스턴스
- Create: `src/lib/schemas.ts` — Zod 응답 스키마
- Create: `src/lib/remotes.ts` — API 함수 (fetch* 네이밍, *Params 객체)

**Step 1: Ky 인스턴스 생성**

```typescript
// src/lib/api-client.ts
import ky from "ky";

export const apiClient = ky.create({
  prefixUrl: "/api",
  timeout: 10_000,
});
```

**Step 2: Zod 스키마 정의**

```typescript
// src/lib/schemas.ts
import { z } from "zod";

// 기존 types.ts의 주요 타입을 Zod 스키마로 정의
// Session, StoredEvent, ToolUsageStat 등 API 응답 타입
export const sessionSchema = z.object({ ... });
export const storedEventSchema = z.object({ ... });
// ... 나머지 응답 타입
```

기존 `types.ts` 460줄에서 API 응답 관련 타입을 Zod 스키마로 이동.
서버 내부 타입(DB 모델 등)은 types.ts에 유지.

**Step 3: Remote 함수 작성**

```typescript
// src/lib/remotes.ts
import { apiClient } from "./api-client";
import type { Session, StoredEvent, ... } from "./types";

// ── GET /api/sessions — sessions ──
interface FetchSessionsParams {
  status?: string;
  userId?: string;
  toolName?: string;
}

export const fetchSessions = async (params: FetchSessionsParams) => {
  const data = await apiClient.get("sessions", { searchParams: params }).json<{ sessions: Session[] }>();
  return data.sessions;
};

// ── GET /api/analytics — analytics ──
interface FetchAnalyticsParams {
  userId?: string;
  toolName?: string;
}

export const fetchAnalytics = async (params: FetchAnalyticsParams) => {
  return apiClient.get("analytics", { searchParams: params }).json<AnalyticsResponse>();
};

// ── GET /api/feed — events ──
interface FetchFeedParams {
  limit?: number;
  userId?: string;
  toolName?: string;
}

export const fetchFeed = async (params: FetchFeedParams) => {
  const data = await apiClient.get("feed", { searchParams: params }).json<{ events: StoredEvent[] }>();
  return data.events;
};

// ── GET /api/cost — cost ──
interface FetchCostParams {
  userId?: string;
  days?: number;
}

export const fetchCost = async (params: FetchCostParams) => {
  return apiClient.get("cost", { searchParams: params }).json<CostResponse>();
};

// ── GET /api/sessions/:id/events — session events ──
interface FetchSessionEventsParams {
  sessionId: string;
}

export const fetchSessionEvents = async ({ sessionId }: FetchSessionEventsParams) => {
  const data = await apiClient.get(`sessions/${sessionId}/events`).json<{ events: StoredEvent[] }>();
  return data.events;
};

// ── GET /api/config — config ──
export const fetchConfig = async () => {
  return apiClient.get("config").json<ConfigResponse>();
};

// ── GET /api/adoption — adoption ──
interface FetchAdoptionParams {
  view: string;
  days?: number;
  userId?: string;
}

export const fetchAdoption = async (params: FetchAdoptionParams) => {
  return apiClient.get("adoption", { searchParams: params }).json();
};
```

**Step 4: 커밋**

```bash
git add src/lib/api-client.ts src/lib/schemas.ts src/lib/remotes.ts
git commit -m "feat(cc-monitor): Ky API 클라이언트 + Remote 함수 + Zod 스키마 추가"
```

---

## Task 3: Tanstack Query 설정 + queryOptions 팩토리

**Files:**
- Modify: `src/pages/_app.tsx` — QueryClientProvider 추가
- Create: `src/lib/queries-client.ts` — queryOptions 팩토리 (기존 queries.ts는 서버 DB 쿼리)

**Step 1: _app.tsx에 QueryClientProvider 래핑**

```tsx
// src/pages/_app.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        refetchInterval: 10_000, // 기존 usePolling 대체
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <Component {...pageProps} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```

**Step 2: queryOptions 팩토리 생성**

```typescript
// src/lib/queries-client.ts
import { queryOptions } from "@tanstack/react-query";
import { fetchSessions, fetchFeed, fetchAnalytics, fetchCost, fetchSessionEvents, fetchConfig } from "./remotes";

export const sessionsQueryOptions = (params: { userId?: string; toolName?: string }) =>
  queryOptions({
    queryKey: ["sessions", params],
    queryFn: () => fetchSessions({ status: "all", ...params }),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

export const feedQueryOptions = (params: { userId?: string; toolName?: string }) =>
  queryOptions({
    queryKey: ["feed", params],
    queryFn: () => fetchFeed({ limit: 30, ...params }),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

export const analyticsQueryOptions = (params: { userId?: string; toolName?: string }) =>
  queryOptions({
    queryKey: ["analytics", params],
    queryFn: () => fetchAnalytics(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

export const costQueryOptions = (params: { userId?: string; days?: number }) =>
  queryOptions({
    queryKey: ["cost", params],
    queryFn: () => fetchCost(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

export const sessionEventsQueryOptions = (sessionId: string) =>
  queryOptions({
    queryKey: ["sessionEvents", sessionId],
    queryFn: () => fetchSessionEvents({ sessionId }),
    enabled: !!sessionId,
  });

export const configQueryOptions = () =>
  queryOptions({
    queryKey: ["config"],
    queryFn: fetchConfig,
    staleTime: 60_000,
  });
```

**Step 3: 커밋**

```bash
git add src/pages/_app.tsx src/lib/queries-client.ts
git commit -m "feat(cc-monitor): Tanstack Query 설정 + queryOptions 팩토리 추가"
```

---

## Task 4: index.tsx 리팩토링 — usePolling → useQuery

기존 usePolling + useCallback 패턴을 Tanstack Query의 useQuery로 교체.

**Files:**
- Modify: `src/pages/index.tsx` — usePolling 제거, useQuery 사용
- Delete (나중에): `src/hooks/usePolling.ts` — 더 이상 불필요

**Step 1: index.tsx 전면 리팩토링**

- `usePolling` 3개 → `useQuery` 3개로 교체
- `fetchSessions`, `fetchFeed`, `fetchAnalytics` useCallback 제거
- 필터 상태는 유지 (추후 Nuqs로 전환 가능)
- `getServerSideProps` 유지 (SSR 초기 데이터 → useQuery initialData로 전달)

```tsx
// 핵심 변경 부분
const { data: sessions } = useQuery({
  ...sessionsQueryOptions({ userId: selectedUserId || undefined, toolName: selectedToolName || undefined }),
  initialData: initial.sessions,
});
```

**Step 2: 커밋**

```bash
git commit -m "refactor(cc-monitor): index.tsx usePolling → Tanstack Query 전환"
```

---

## Task 5: CostTracking 리팩토링 — useEffect+fetch → useQuery + 인라인 스타일 → Tailwind

**Files:**
- Modify: `src/components/CostTracking.tsx`

**Step 1: useEffect+fetch → useQuery 전환**

- `useState(data/loading/error)` + `useEffect(fetchData)` → `useQuery(costQueryOptions)` 단일 호출
- 기존 `styles` 객체 (200줄) → Tailwind 클래스로 전환

**Step 2: 커밋**

```bash
git commit -m "refactor(cc-monitor): CostTracking useQuery 전환 + 인라인 스타일 → Tailwind"
```

---

## Task 6: SessionsTab 리팩토링 — fetch → useQuery + 컴포넌트 분리

**Files:**
- Modify: `src/components/SessionsTab.tsx` (577줄 → ~200줄)
- Create: `src/components/sessions/SessionDrawer.tsx`
- Create: `src/components/sessions/SessionEfficiency.tsx`
- Create: `src/components/sessions/TokenCell.tsx`

**Step 1: SessionDrawer, SessionEfficiency, TokenCell 분리**

SessionsTab.tsx에서 큰 내부 컴포넌트들을 별도 파일로 분리.

**Step 2: fetchSessionEvents → useQuery 전환**

```tsx
// SessionDrawer 내부
const { data: events, isLoading } = useQuery(sessionEventsQueryOptions(session.session_id));
```

**Step 3: 유틸 함수 분리**

`formatTokens`, `formatTime`, `formatDate`, `shortPath` 등 → `src/lib/format.ts`로 이동.

**Step 4: 커밋**

```bash
git commit -m "refactor(cc-monitor): SessionsTab 컴포넌트 분리 + useQuery 전환"
```

---

## Task 7: ConfigOverview 리팩토링

**Files:**
- Modify: `src/components/ConfigOverview.tsx`

**Step 1: 내부 fetch → useQuery 전환**

ConfigOverview도 내부에서 fetch를 사용 중 → `configQueryOptions` 사용으로 전환.

**Step 2: 커밋**

```bash
git commit -m "refactor(cc-monitor): ConfigOverview useQuery 전환"
```

---

## Task 8: ActivityFeed 인라인 스타일 → Tailwind

**Files:**
- Modify: `src/components/ActivityFeed.tsx`

**Step 1: styles 객체 제거, Tailwind 클래스로 전환**

CostTracking과 동일하게 인라인 스타일 → Tailwind.

**Step 2: 커밋**

```bash
git commit -m "refactor(cc-monitor): ActivityFeed 인라인 스타일 → Tailwind"
```

---

## Task 9: usePolling 제거 + 타입 정리

**Files:**
- Delete: `src/hooks/usePolling.ts`
- Modify: `src/lib/types.ts` — 서버 전용 타입만 유지, 불필요 타입 정리

**Step 1: usePolling.ts 삭제**

모든 사용처가 useQuery로 전환되었으므로 삭제.

**Step 2: types.ts 정리**

460줄 단일 파일에서 불필요한 타입 제거, 도메인별 정리 검토 (파일 분리는 규모에 따라 판단).

**Step 3: 커밋**

```bash
git commit -m "refactor(cc-monitor): usePolling 제거 + 타입 정리"
```

---

## Task 10: 전체 검증 + useEffect 기명 함수 통일

**Files:**
- 전체 검토

**Step 1: 빌드 확인**

```bash
cd services/cc-monitor && pnpm build
```

**Step 2: useEffect 기명 함수 점검**

모든 useEffect가 기명 함수인지 grep으로 확인:
```bash
grep -n "useEffect(() =>" src/**/*.tsx
```
발견되면 기명 함수로 변환.

**Step 3: any 타입 점검**

```bash
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"
```

**Step 4: 최종 커밋**

```bash
git commit -m "refactor(cc-monitor): useEffect 기명 함수 통일 + any 타입 제거"
```

---

## 우선순위 요약

| Task | 내용 | 난이도 | 영향도 |
|------|------|--------|--------|
| 1 | 의존성 설치 | 낮음 | - |
| 2 | API 클라이언트 (Ky + Zod + Remotes) | 중간 | 높음 |
| 3 | Tanstack Query 설정 | 중간 | 높음 |
| 4 | index.tsx useQuery 전환 | 중간 | 높음 |
| 5 | CostTracking 리팩토링 | 중간 | 중간 |
| 6 | SessionsTab 분리 + useQuery | 높음 | 높음 |
| 7 | ConfigOverview useQuery | 낮음 | 낮음 |
| 8 | ActivityFeed Tailwind 전환 | 낮음 | 중간 |
| 9 | usePolling 제거 + 타입 정리 | 낮음 | 중간 |
| 10 | 전체 검증 | 낮음 | - |
