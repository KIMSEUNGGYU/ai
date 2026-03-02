---
tags:
  - ai-agent
  - claude-agent-sdk
  - hooks
date: 2026-03-01
step: 4
---

# Step 4: Hooks — 에이전트 감시자

## 배운 것

- `hooks` 옵션으로 에이전트 루프의 특정 시점에 개입하는 콜백 함수 등록
- PostToolUse: 도구 실행 후 감사 로그 기록 (투명 — 에이전트는 훅 존재를 모름)
- PreToolUse: 도구 실행 전 차단 가능 (`{ blocked: true, reason: "..." }` 반환)
- `matcher: ".*"`로 전체 도구 매칭, `"Read|Edit"`로 특정 도구만 필터링

## 핵심 인사이트

### PostToolUse = 구경꾼, PreToolUse = 경비원

- PostToolUse: 이미 실행된 후라 **관찰만** 가능 (로그, 알림)
- PreToolUse: 실행 전이라 **차단/허용** 제어 가능 (보안 정책)

### 차단해도 에이전트는 우회한다

Read를 PreToolUse로 차단했는데, Claude가 package.json 내용을 여전히 출력함.
MCP 도구나 추론으로 대체 경로를 찾은 것. 완전한 차단이 필요하면 모든 경로를 막아야 함.

### 플러그인 훅 vs SDK 훅

| | 플러그인 훅 | SDK 훅 |
|---|---|---|
| 정의 | 셸 명령어 | TypeScript 함수 |
| 인자 | 환경변수 ($TOOL_NAME 등) | 함수 파라미터 (input, toolUseID) |
| 복잡한 로직 | 어려움 | 쉬움 (async/await, DB, API) |
| 상태 유지 | 안됨 (매번 새 프로세스) | 가능 (변수/메모리 공유) |

둘 다 감사 로그, 조건부 차단은 가능. 차이는 유연성.
처음에 "플러그인에서는 못한다"고 말했지만 정정 — 단순한 건 둘 다 되고, 복잡한 로직만 SDK가 유리.

플러그인 훅에서 쓸 수 있는 환경변수:
- `$TOOL_NAME` — 도구 이름 (Read, Glob, Bash 등)
- `$TOOL_INPUT` — 도구 입력 (JSON 문자열)
- `$TOOL_USE_ID` — 도구 호출 고유 ID

### audit.log를 하는 이유

- **학습 목적**: 훅 동작을 관찰하기 위한 가장 단순한 예제
- **실전 목적** (에이전트를 무인으로 돌릴 때):
  - 디버깅 — 에이전트가 어떤 도구를 언제 썼는지 추적
  - 비용 추적 — 어떤 도구가 많이 호출되는지
  - 보안 감사 — 민감한 파일 접근 여부 확인

플러그인에서는 Claude Code가 알아서 돌리니까 이런 감시 레이어를 넣기 어려움.
SDK로 하네스를 직접 만들면 자유롭게 추가 가능.

### 훅 콜백 시그니처

```typescript
(input: HookInput, toolUseID: string | undefined, options: { signal: AbortSignal })
  => Promise<HookJSONOutput>
```

- `input.tool_name`: 도구 이름
- `input.tool_input`: 도구 입력 (JSON)
- 반환값: `{}` (허용) 또는 `{ blocked: true, reason: "..." }` (차단)

## 비용

- Haiku, 4턴: ~$0.10

## 다음 스텝

Step 5: Subagents — 독립 컨텍스트에서 병렬 작업 위임. `agents` 옵션으로 커스텀 서브에이전트 정의.
