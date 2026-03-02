# Block 1: 세션 이어가기

## Phase A — 코드 작성 + 실행

### 코드

`src/m06-sessions/sessions.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  let sessionId: string | undefined;

  // === 1차 쿼리: 파일 읽기 + 세션 ID 캡처 ===
  console.log("=== 1차 쿼리: 파일 읽기 ===\n");

  for await (const message of query({
    prompt: "package.json을 읽고 의존성 목록을 알려줘.",
    options: {
      tools: ["Read"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    const msg = message as any;
    if (msg.type === "system" && msg.subtype === "init") {
      sessionId = msg.session_id;
      console.log(`📌 세션 ID 캡처: ${sessionId}\n`);
    }
    if (msg.type === "result") {
      console.log(`[1차 결과] ${msg.result?.slice(0, 200)}`);
    }
  }

  // === 2차 쿼리: 세션 이어서 질문 ===
  console.log("\n=== 2차 쿼리: 이전 맥락 기반 질문 ===\n");

  for await (const message of query({
    prompt: "방금 읽은 의존성 중 @anthropic-ai/claude-agent-sdk의 버전은?",
    options: {
      resume: sessionId,
    },
  })) {
    const msg = message as any;
    if (msg.type === "result") {
      console.log(`[2차 결과] ${msg.result?.slice(0, 200)}`);
    }
  }
}

main().catch(console.error);
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m06-sessions/sessions.ts
```

### 관찰 포인트

1. 2차 쿼리에서 "방금 읽은"이라고 했는데 정확히 답하는가?
2. 2차 쿼리에서 에이전트가 파일을 다시 읽지 않고 답하는가?
3. `resume` 옵션의 값이 1차 쿼리의 session_id와 같은가?

> ⛔ **STOP** — 2차 쿼리의 결과를 공유해주세요. 에이전트가 맥락을 기억했는가?

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> `resume`로 세션을 이어가면 에이전트는 **이전 대화 전체**를 기억한다.
> 파일을 다시 읽지 않고도 이전에 읽은 내용을 참조할 수 있다.
> 이것은 토큰 절약 + 자연스러운 멀티턴 대화를 가능하게 한다.

### 퀴즈

**Q1**: `resume` 없이 2차 쿼리를 하면 어떤 차이가 있는가?

**Q2**: 3차, 4차 쿼리도 같은 session_id로 이어갈 수 있는가?

### 정답 가이드

- Q1: 에이전트가 "방금 읽은 의존성"이 무엇인지 모름. 새 세션이므로 맥락이 없음
- Q2: 가능하다. 같은 session_id로 계속 이어갈 수 있음. 대화가 길어지면 자동 압축

> Block 2에서 멀티스텝 워크플로우를 설계합니다. "Block 2 시작"이라고 말해주세요.
