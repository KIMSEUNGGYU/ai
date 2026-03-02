# Block 1: 코드 리뷰어 에이전트 만들기

## Phase A — 코드 작성 + 실행

### 코드

`src/m03-prompt/prompt.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M03: 코드 리뷰어 에이전트 ===\n");

  for await (const message of query({
    prompt: "src/m01-hello/hello.ts 파일을 리뷰해줘.",
    options: {
      systemPrompt: `당신은 시니어 TypeScript 코드 리뷰어입니다.
코드를 읽고 다음 관점에서 리뷰하세요:
1. 에러 핸들링이 적절한가?
2. 타입 안전성은 확보되었는가?
3. 개선 제안 (구체적 코드 포함)

리뷰 결과를 마크다운 형식으로 출력하세요.`,
      tools: ["Read", "Glob", "Grep"],
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
      if (text) console.log(text);
    }
    if (msg.type === "result") {
      console.log(`\n--- cost: $${msg.total_cost_usd} | turns: ${msg.num_turns} ---`);
    }
  }
}

main().catch(console.error);
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m03-prompt/prompt.ts
```

### 관찰 포인트

1. 에이전트가 코드 리뷰어처럼 행동하는가?
2. 에러 핸들링, 타입 안전성, 개선 제안 3가지를 모두 다루는가?
3. M02의 결과와 비교: 같은 도구인데 출력이 어떻게 달라졌는가?
4. 출력 형식이 마크다운인가?

> ⛔ **STOP** — 리뷰 결과를 공유하고, M02와의 차이점을 알려주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> System Prompt가 에이전트의 행동을 **근본적으로** 결정한다.
> M02에서는 "정보 전달"이었다면, M03에서는 "분석적 리뷰"가 되었다.
> 같은 Read 도구를 사용하지만 **관점이 다르니 결과가 다르다**.

### 퀴즈

**Q1**: System Prompt에 "결과를 JSON으로 출력하세요"를 추가하면 에이전트가 JSON을 반환하는가?

**Q2**: System Prompt와 사용자 프롬프트(prompt)의 우선순위는?

### 정답 가이드

- Q1: 대부분 JSON으로 반환한다. 출력 형식 지시는 매우 잘 따름. 하지만 Claude가 설명 텍스트를 추가할 수도 있어서 `JSON.parse` 전에 파싱 필요
- Q2: System Prompt = 역할/규칙 (항상 적용), 사용자 프롬프트 = 구체적 작업 (매번 다름). 둘이 충돌하면 복잡해지므로 보완적으로 설계해야 함

> Block 2에서 프롬프트를 바꿔 실험합니다. "Block 2 시작"이라고 말해주세요.
