# Block 1: User Input — 에이전트 실행 중 사용자 입력

## Phase A — 코드 작성 + 실행

### 핵심 개념

에이전트가 실행 중 사용자에게 질문할 수 있다. SDK의 `userInput` 콜백으로 구현한다.

```typescript
options: {
  userInput: async (question: string) => {
    // 에이전트가 사용자에게 질문할 때 호출
    // CLI에서 readline으로 입력 받기, 또는 웹 UI에서 모달 표시
    return "사용자의 답변";
  },
}
```

### 코드

`src/m10-streaming/streaming.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "readline/promises";
import { stdin, stdout } from "process";

async function main() {
  console.log("=== M10: Streaming & User Input ===\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });

  for await (const message of query({
    prompt: "이 프로젝트의 package.json을 읽고, 새로운 의존성을 추가할지 사용자에게 물어봐.",
    options: {
      tools: ["Read"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    const msg = message as any;

    if (msg.type === "assistant") {
      const text = msg.message?.content
        ?.filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      if (text) console.log(`🤖 ${text}`);
    }

    if (msg.type === "result") {
      console.log(`\n✅ 완료 | turns: ${msg.num_turns}`);
    }
  }

  rl.close();
}

main().catch(console.error);
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m10-streaming/streaming.ts
```

### 관찰 포인트

1. 에이전트가 사용자에게 질문하려고 시도하는가?
2. `permissionMode: "bypassPermissions"`에서는 사용자 입력이 어떻게 처리되는가?
3. 스트리밍 중 실시간으로 텍스트가 출력되는가, 한꺼번에 출력되는가?

> ⛔ **STOP** — 실행 결과를 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> User Input은 에이전트의 **인터랙티브 능력**을 가능하게 한다.
> bypassPermissions 모드에서는 사용자 확인 없이 진행되지만,
> default 모드에서는 위험한 작업 시 자동으로 사용자 확인을 요청.
>
> 이것은 Claude Code의 "도구 사용 전 물어보기"와 동일한 메커니즘.

### 퀴즈

**Q1**: 웹 애플리케이션에서 `userInput` 콜백을 어떻게 구현할 수 있는가?

### 정답 가이드

- Q1: WebSocket이나 SSE로 클라이언트에 질문을 보내고, 사용자 응답을 받아서 콜백에서 반환. 또는 HTTP long-polling

> Block 2에서 대화형 에이전트 UX를 설계합니다. "Block 2 시작"이라고 말해주세요.
