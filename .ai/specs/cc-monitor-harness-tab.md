---
title: cc-monitor Harness 탭 추가
date: 2026-03-27
status: done
---

# cc-monitor Harness 탭 설계

## 개요

cc-monitor에 "Harness" 탭을 신설하여, 하네스 고도화를 위한 데이터를 시각화한다.
기존 탭(Overview/History/Cost/Sessions)이 **사용량/비용** 관점이라면, Harness 탭은 **하네스 품질** 관점.

## 범위

- 대상: 개인용 (멀티유저 구조는 이미 있으므로 팀 확장 시 깨지지 않음)
- 스키마 변경: 없음. 기존 데이터만 활용
- 새 페이지/탭: Harness 탭 1개 (내부 4개 섹션)

## 섹션 1: 스킬 사용 빈도

### 데이터 소스
- events 테이블에서 `tool_name = 'Skill'` AND `event_type = 'PostToolUse'`
- `tool_input_summary`에서 스킬명 추출 (형식: `"skill: recap"` → `"recap"`)
- 슬래시 커맨드 파싱은 첫 버전에서 제외. 근거: prompt_text에서 `/path/to/file` 같은 경로와 `/commit` 같은 커맨드를 안정적으로 구분하기 어려움. `tool_name = 'Skill'`만으로 정확한 스킬 사용 데이터를 얻을 수 있음. 향후 필요 시 확장.

### 쿼리
```ts
getSkillUsageStats(days: number): Promise<{
  skills: Array<{ name: string; count: number }>;
  daily: Array<{ date: string; skill: string; count: number }>;
}>
```

### UI
- 바 차트: 스킬명 × 사용 횟수 (내림차순)
- 라인 차트: 일별 스킬 사용 추이 (상위 5개 스킬)
- Empty state: 스킬 사용 데이터가 없을 때 "아직 스킬 사용 기록이 없습니다" 메시지

## 섹션 2: 컨벤션 주입 시각화

### 데이터 소스
- events 테이블에서 `event_type = 'PluginHook'`
- **raw_data JSON 파싱**으로 데이터 추출 (tool_input_summary는 사용하지 않음. raw_data가 구조화된 JSON이므로 더 정확)
- 추출 필드: `injected_conventions`, `injection_bytes`, `injection_total_bytes`, `matched_keywords`

### 쿼리
```ts
getConventionInjectionStats(days: number): Promise<{
  conventions: Array<{ name: string; count: number; totalBytes: number; topKeywords: string[] }>;
  daily: Array<{ date: string; convention: string; count: number }>;
}>
```

### UI
- 바 차트: 컨벤션명 × 주입 횟수
- 테이블: 컨벤션명 | 횟수 | 총 바이트 | 상위 키워드
- 인사이트: 주입 빈도가 높은 컨벤션 = 해당 영역 작업이 많거나, 스킬로 내재화할 여지가 있다는 신호
- Empty state: PluginHook 이벤트가 없을 때 "fe-workflow 플러그인 훅이 활성화되면 컨벤션 주입 데이터가 표시됩니다" 메시지

## 섹션 3: Adoption 추세

### 데이터 소스
- sessions + events 테이블 집계 → adoption_snapshots 테이블에 저장

### 스냅샷 생성 함수
```ts
generateAdoptionSnapshot(period: 'day' | 'week'): Promise<AdoptionSnapshot>
```
> 기존 types.ts의 AdoptionPeriod(`"day" | "week" | "month"`)에 맞춤. 스펙 범위에서는 day/week만 사용.

집계 항목:
- active_users: 기간 내 고유 user_id 수
- total_users: 전체 user_id 수 (누적)
- total_sessions: 기간 내 세션 수
- avg_session_duration_min: started_at ~ ended_at 평균
- avg_sessions_per_user: total_sessions / active_users
- avg_turns_per_session: num_turns 평균
- top_tools_json: tool_summary 합산 후 상위 10개

### 실행 방식
- API Route: `POST /api/adoption/generate`
- 요청 body Zod 스키마: `z.object({ period: z.enum(["day", "week"]) })`
- 대시보드에 "스냅샷 생성" 버튼 (개인용이므로 수동 트리거)
- 팀 확장 시 Vercel Cron 추가

### UI
- 라인 차트: 일별/주별 세션 수, 평균 턴 수 추이
- 수치 카드: 이번 주 vs 지난 주 비교 (증감율)
- Empty state: 스냅샷이 없을 때 "스냅샷 생성" 버튼과 안내 메시지

## 섹션 4: Config 변화 추적

### 데이터 소스
- sessions 테이블의 config 필드: `config_claude_md_count`, `config_rules_count`, `config_mcp_count`, `config_hooks_count`, `config_rules_names`, `config_mcp_names`, `config_hooks_events`, `config_claude_md_paths`

### 쿼리
```ts
getConfigTimeline(days: number): Promise<{
  timeline: Array<{
    date: string;
    rulesCount: number;
    hooksCount: number;
    mcpCount: number;
    claudeMdCount: number;
  }>;
  changes: Array<{
    date: string;
    type: 'added' | 'removed';
    category: 'rules' | 'hooks' | 'mcp' | 'claude_md';
    item: string;
  }>;
}>
```

### Diff 로직
1. sessions에서 날짜별 마지막 세션 추출 (`ORDER BY started_at DESC`, 날짜별 1건)
2. 각 config JSON 필드(`config_rules_names` 등)를 `JSON.parse()` → `Set<string>`으로 변환
3. 전일 Set과 비교: `added = current - previous`, `removed = previous - current`
4. Edge cases:
   - **세션 없는 날(gap)**: 이전 날 값을 carry-forward. 변경 없음으로 처리
   - **config 필드가 null**: 해당 세션 건너뛰고 이전 유효 값 유지 (SessionStart 수집 실패 케이스)
   - **첫 날(이전 값 없음)**: 모든 항목을 'added'로 표시

### UI
- 라인 차트: 날짜별 rules/hooks/mcp/claude_md count 추이
- 변경 이력 테이블: 날짜 | 변경 유형(+/-) | 카테고리 | 항목명

## 탭 구조

```
Harness 탭
├── 날짜 필터 (7/14/30/90일) — HarnessTab 내에서 DAYS_OPTIONS 별도 정의
├── 섹션 1: Skills (바 차트 + 일별 추이)
├── 섹션 2: Conventions (바 차트 + 테이블)
├── 섹션 3: Adoption (추세 차트 + 비교 카드)
└── 섹션 4: Config (추이 차트 + 변경 이력)
```

## 구현 범위

### 백엔드 (lib/queries)
- `getSkillUsageStats()`
- `getConventionInjectionStats()`
- `generateAdoptionSnapshot()`
- `getAdoptionTimeline()`
- `getConfigTimeline()`

### API Routes
- `GET /api/harness?days=` — 스킬 + 컨벤션 + Config 데이터 (번들). Config diff 계산이 병목이 되면 별도 엔드포인트 분리 가능.
  - 쿼리 파라미터 Zod: `z.object({ days: z.coerce.number().optional().default(30) })`
- `POST /api/adoption/generate` — 스냅샷 생성
  - Body Zod: `z.object({ period: z.enum(["day", "week"]) })`
- `GET /api/adoption?period=&days=` — 스냅샷 조회
  - 쿼리 파라미터 Zod: `z.object({ period: z.enum(["day", "week"]).optional(), days: z.coerce.number().optional().default(30) })`

### 프론트엔드
- `components/HarnessTab.tsx` — 탭 메인 컴포넌트 (기존 CostTracking.tsx, HistoryTab.tsx와 같은 레벨)
- `index.tsx` TAB_IDS/TABS에 "harness" 추가
- 차트: 기존 recharts 활용 (Overview에서 이미 사용 중)
- 각 섹션별 empty state 처리

## 향후 확장
- **5번: 스킬 동기화** — config_snapshot에 플러그인/스킬 버전 정보 추가 수집. 이번 스코프에서 제외.
- **슬래시 커맨드 파싱** — UserPromptSubmit에서 `/`로 시작하는 커맨드 추적. 파싱 규칙 확립 후 추가.
