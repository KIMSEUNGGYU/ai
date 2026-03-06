# cc-monitor Phase 2: 이벤트 타임라인 필터링 + 도구 설명 + 수집 확대

> 작성일: 2026-03-06
> 상태: 확정

## 목표

세션 상세의 이벤트 타임라인에서 **도구 타입별 멀티 필터링**, **도구명 툴팁 설명**, **AskUserQuestion 수집 확대**를 구현한다.

---

## 1. 이벤트 타임라인 멀티 필터링

### UI
- 타임라인 상단에 **토글 배지** 나열
- 클릭으로 on/off, 복수 선택 가능 (OR 필터)
- "All" / "Clear" 버튼 제공
- 선택된 배지는 강조, 미선택은 흐리게

### 도구 타입 카테고리

| 카테고리 | 매핑 도구/이벤트 | 배지 색상 |
|---------|----------------|----------|
| Skill | Skill | violet |
| Agent | Agent, SubagentStart, SubagentStop | emerald |
| Bash | Bash | orange |
| File | Read, Edit, Write, NotebookEdit | blue |
| Search | Grep, Glob, ToolSearch | yellow |
| MCP | mcp__* (prefix 매칭) | teal |
| Prompt | UserPromptSubmit | slate |
| Session | SessionStart, SessionEnd, Stop, PreCompact | red |
| Question | AskUserQuestion | pink |

### 구현
- **프론트엔드 필터링** (이벤트는 이미 전체 로드됨)
- `getToolCategory(toolName, eventType)` 매핑 함수 → `src/lib/tool-categories.ts`
- `SessionsTab.tsx` 내 상태: `selectedCategories: Set<string>`
- 카테고리별 이벤트 카운트 표시 (배지에 숫자)

---

## 2. 도구명 툴팁

### UI
- 타임라인에서 **도구명에 호버** → 설명 팝오버
- shadcn `Tooltip` 컴포넌트 사용

### 데이터
- `src/lib/tool-descriptions.ts` — 정적 매핑 객체

```typescript
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  ToolSearch: "사용 가능한 도구를 검색/로드하는 메타 도구",
  AskUserQuestion: "사용자에게 선택지를 제시하고 답변을 받는 도구",
  Skill: "등록된 스킬(slash command)을 실행",
  Agent: "독립 서브에이전트를 생성하여 병렬 작업 수행",
  Bash: "쉘 명령어 실행",
  Read: "파일 읽기",
  Edit: "파일 부분 수정",
  Write: "파일 생성/전체 덮어쓰기",
  Grep: "파일 내용 검색 (정규식 지원)",
  Glob: "파일명 패턴 매칭 검색",
  NotebookEdit: "Jupyter 노트북 편집",
  // MCP 도구: "MCP: {provider}/{tool}" 패턴으로 자동 생성
};
```

### MCP 도구 설명
- `mcp__serena__find_symbol` → "MCP: serena / find_symbol"
- prefix 파싱으로 자동 생성, 수동 오버라이드 가능

---

## 3. AskUserQuestion 수집 확대

### 현재
- PostToolUse로 수집되지만 질문/답변 내용 미저장
- `tool_input_summary`에 도구명만 기록

### 개선
- `event-processor.ts`에 AskUserQuestion 전용 요약 로직 추가
- `tool_input_summary`: 질문 텍스트 (첫 번째 질문, 100자 제한)
- `raw_data`: 전체 질문 + 선택된 답변 JSON

### 타임라인 표시
```
10:23  Question  AskUserQuestion
       Q: 이벤트 타임라인 필터링 UI를 어떤 형태로...
       A: 토글 배지
```

### 스키마 변경
- 불필요 (기존 `tool_input_summary` + `raw_data` 필드 활용)

---

## 4. mock-data 유지 방침

- Prisma + Turso 전환 완료 상태
- `isDemoMode()` = `!TURSO_DATABASE_URL`
- mock-data는 **데모/포트폴리오용으로 유지**
- 새 기능 추가 시 mock-data도 해당 카테고리 반영

---

## 파일 변경 목록

### 신규
- `src/lib/tool-categories.ts` — 도구 타입 카테고리 매핑
- `src/lib/tool-descriptions.ts` — 도구 설명 정적 데이터

### 수정
- `src/components/SessionsTab.tsx` — 필터 UI + 툴팁 적용
- `collector/send-event.ts` 또는 `src/lib/event-processor.ts` — AskUserQuestion 요약 로직
- `src/lib/mock-data.ts` — 새 카테고리 반영 (AskUserQuestion 이벤트 추가)

### 미변경
- `prisma/schema.prisma` — 스키마 변경 없음
- API Routes — 프론트엔드 필터링이므로 변경 없음
