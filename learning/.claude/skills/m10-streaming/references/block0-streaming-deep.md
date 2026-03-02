# Block 0: 스트리밍 심화

## Phase A — 개념

### 핵심 개념

M01에서 `for await (const message of query(...))` 패턴을 배웠다. 이번에는 스트리밍을 더 깊이 활용한다.

### 스트리밍 메시지 타입 전체 목록

```typescript
type MessageType =
  | "system"        // init, model_info
  | "assistant"     // Claude 응답 (text + tool_use)
  | "tool_result"   // 도구 실행 결과
  | "result"        // 최종 결과 (success/error)
  | "rate_limit_event"  // API 사용량 정보
  | "user_input_request" // 사용자 입력 요청
```

### 실시간 처리 패턴

**패턴 1: 프로그레스 바**

```typescript
let toolCallCount = 0;

for await (const message of query({ ... })) {
  const msg = message as any;
  if (msg.type === "assistant") {
    const toolUses = msg.message?.content?.filter((c: any) => c.type === "tool_use");
    if (toolUses?.length) {
      toolCallCount += toolUses.length;
      process.stdout.write(`\r🔧 도구 호출: ${toolCallCount}회...`);
    }
  }
  if (msg.type === "result") {
    console.log(`\n✅ 완료! 총 ${toolCallCount}회 도구 사용`);
  }
}
```

**패턴 2: 선택적 메시지 필터링**

```typescript
for await (const message of query({ ... })) {
  const msg = message as any;
  // assistant의 텍스트 응답만 표시 (도구 호출, 시스템 메시지는 무시)
  if (msg.type === "assistant") {
    const text = msg.message?.content
      ?.filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");
    if (text) process.stdout.write(text);
  }
}
```

### 사전 질문

- 스트리밍 중 특정 메시지가 오면 에이전트를 중단할 수 있을까?
- `assistant` 메시지에 텍스트와 tool_use가 **동시에** 올 수 있는 이유는?

> ⛔ **STOP** — 위 질문에 대한 생각을 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 피드백 포인트

- 에이전트 중단: AbortSignal을 사용해 `query()`를 중단할 수 있음
- 텍스트 + tool_use 동시: Claude가 "파일을 읽어보겠습니다"(text) + Read 호출(tool_use)을 한 턴에 수행

### 퀴즈

**Q1**: `for await` 루프에서 `break`하면 에이전트가 종료되는가?

### 정답 가이드

- Q1: AsyncGenerator가 종료되면서 에이전트 프로세스도 정리됨. 하지만 CLI 서브프로세스가 완전히 정리되는지는 구현에 따라 다름

> Block 1에서 userInput 콜백을 사용합니다. "Block 1 시작"이라고 말해주세요.
