---
tags:
  - ai-agent
  - claude-agent-sdk
  - sessions
date: 2026-03-02
step: 6
---

# Step 6: Sessions — 대화 이어가기

## 배운 것

- `system/init` 메시지에서 `session_id`가 **딱 한 번** 발행됨 — 이후 메시지에는 없음
- `resume: sessionId`로 이전 대화 맥락을 기억한 채 이어가기 가능
- `forkSession: true`로 같은 지점에서 분기 가능 (Git branch처럼)
- `result` 메시지에도 `session_id`가 포함됨 (확인용)

## 핵심 인사이트

### resume은 대화만 이어가고, 옵션은 이어가지 않는다

1차 쿼리에서 `tools: ["Read"]` (70개), 2차에서 `resume`만 지정하고 `tools` 생략하니 90개로 변경됨.

```
1차: tools: ["Read"]        → 70개
2차: resume만 (tools 생략)   → 90개 (기본값 = 전체 허용)
```

`resume`은 **대화 기록(메시지)**만 이어가는 것이지, `tools`, `model`, `systemPrompt` 같은 **실행 옵션**은 매번 새로 지정해야 함.

### resume 유무의 극명한 차이

```
2차 (resume O): "^0.2.50입니다" → 1차에서 읽은 package.json을 기억
3차 (resume X): "아직 어떤 의존성 파일도 읽지 않았습니다" → 맥락 없음
```

같은 질문("방금 읽은 SDK 버전은?")인데 2차는 바로 답변, 3차는 "뭘 읽었는지 모르겠다"고 되물음.

### resume하면 도구 호출 없이 답변 가능

2차 쿼리는 1턴에 끝남. 이전 대화에서 이미 package.json을 읽었으니 다시 읽을 필요 없이 기억에서 답변.

### 세션 ID 형태

```
1차 세션: 6377e243-de14-486c-a96b-711af798b9ec
3차 세션: bb4104ce-6c37-43ac-a9c6-ec645fa993a4  (새 세션 = 새 UUID)
```

UUID v4 형태. resume하면 같은 ID 유지, 새 쿼리면 새 ID 생성.

### forkSession (SDK 문서에서 발견)

```typescript
query({
  prompt: "GraphQL로 재설계하자",
  options: {
    resume: sessionId,
    forkSession: true,  // 원본 보존 + 새 브랜치
  }
});
```

| | `forkSession: false` (기본) | `forkSession: true` |
|---|---|---|
| 세션 ID | 원본 유지 | 새 ID 생성 |
| 원본 | 수정됨 | 보존 |
| 용도 | 대화 이어가기 | 같은 맥락에서 분기 탐색 |

## 비용

```
1차: $0.085 (3턴, 파일 읽기)
2차: $0.051 (1턴, 기억에서 답변) — resume이라 이전 대화 토큰도 입력에 포함
3차: $0.069 (1턴, 맥락 없이 거부)
```

resume이 비용을 줄이진 않음. 이전 대화 기록이 입력 토큰에 포함되기 때문.

## Step 3~5와의 비교

| | Step 3 (Prompt) | Step 5 (Subagent) | Step 6 (Session) |
|---|---|---|---|
| 해결하는 문제 | 무엇을 하게 할까 | 누구에게 시킬까 | 기억을 어떻게 유지할까 |
| 범위 | 한 번의 실행 | 한 번의 실행 | 여러 번의 실행을 연결 |
| SDK 옵션 | `systemPrompt` | `agents` | `resume` |

## 다음 스텝

Step 7: MCP — `mcpServers` 옵션으로 외부 시스템(Playwright 등) 연동. 빌트인 도구를 넘어서 에이전트의 능력 확장.
