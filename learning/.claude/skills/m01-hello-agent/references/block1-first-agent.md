# Block 1: 첫 에이전트 — query()로 에이전트 실행

## Phase A — 개념 + 코드 작성

### 핵심 개념: 에이전트 루프

`query()`는 하네스의 심장이다. 에이전트 루프를 시작하고, 모든 과정을 메시지 스트림으로 내보낸다.

```
사용자 프롬프트
       │
       ▼
┌─── Agent Loop ──────────────────────────┐
│                                          │
│  Claude 응답 ──→ 도구 호출 요청?          │
│       │              │                   │
│       │ No           │ Yes               │
│       ▼              ▼                   │
│    최종 응답      도구 실행               │
│                      │                   │
│                      ▼                   │
│                 결과를 Claude에           │
│                 돌려보냄 ──→ 반복         │
└──────────────────────────────────────────┘
```

이번에는 `tools: []`로 도구를 비활성화한다. 도구 없는 에이전트 = 단순 LLM 호출. 루프가 1턴에 끝난다.

### query() API 시그니처

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: string,         // 사용자 프롬프트
  options: {
    tools?: string[],     // 사용 가능한 도구 ([] = 없음)
    systemPrompt?: string,
    permissionMode?: string,
    allowDangerouslySkipPermissions?: boolean,
    // ... 더 많은 옵션들
  },
})) {
  // message: 에이전트 루프의 각 단계를 스트리밍
}
```

### 코드 확인

`src/m01-hello/hello.ts` 파일을 읽어보자:

```bash
cat src/m01-hello/hello.ts
```

### 실행

```bash
# Claude Code 세션 안에서 실행 시 CLAUDECODE 환경변수 해제 필수
unset CLAUDECODE && npx tsx src/m01-hello/hello.ts
```

### 관찰 포인트

실행 후 다음을 관찰:
1. 어떤 메시지 타입들이 순서대로 출력되는가?
2. `system/init` 메시지에 `session_id`와 `tools` 정보가 있는가?
3. `assistant` 메시지에 Claude의 응답 텍스트가 있는가?
4. `result/success` 메시지에 비용(`cost`)과 턴 수(`turns`)가 있는가?
5. `tool_use` 메시지가 나오는가? (안 나와야 정상 — tools: [])

> ⛔ **STOP** — 실행 결과를 공유해주세요. 어떤 메시지 타입들이 어떤 순서로 출력되었는지 알려주세요.

---

## Phase B — 피드백 + 퀴즈

### 예상 메시지 흐름

정상적인 실행 결과:

```
📦 [1] system/init        ← 에이전트 초기화 (세션 ID, 도구 목록)
⬜ [2] rate_limit_event   ← API 사용량 정보 (무시해도 OK)
🤖 [3] assistant          ← Claude의 응답
✅ [4] result/success     ← 최종 결과 (비용, 시간, 턴 수)
```

### 피드백 포인트

- **system/init**: 에이전트가 시작되면서 세션 정보를 알려줌. `tools: 0개`인 것 확인
- **assistant**: Claude의 실제 응답. `message.content`에 텍스트가 들어있음
- **result/success**: 에이전트 루프 종료. `num_turns: 1` — 도구가 없으니 1턴에 끝남
- **rate_limit_event**: SDK 내부 이벤트. 학습 시에는 무시해도 됨

### 핵심 인사이트

> `query()`는 "질문 → 응답" 한 번이 아니라, **"질문 → [도구 호출 → 결과 피드백 → 재응답 → ...] 반복"**을 스트리밍한다.
> 이번에는 도구가 없어서 루프가 1턴에 끝났을 뿐이다.

### 퀴즈

**Q1**: `tools: []`을 설정했는데 `system/init`에서 tools 수가 0이 아닐 수 있다. 왜일까?

**Q2**: `result/success` 메시지의 `num_turns`가 1인 이유는?

### 정답 가이드

- Q1: MCP 서버가 연결되어 있으면 MCP 도구(Gmail, Slack 등)가 자동으로 로드될 수 있다. `tools: []`은 빌트인 도구만 비활성화한다.
- Q2: 도구가 없으므로 Claude가 바로 텍스트로 응답하고 끝난다. 도구가 있으면 "도구 호출 → 결과 → 재응답"으로 턴이 증가한다.

### 다음 Block 안내

> Block 2에서 메시지 스트림을 더 깊이 분석합니다. 각 메시지 타입의 구조와 활용법을 배웁니다. "Block 2 시작"이라고 말해주세요.
