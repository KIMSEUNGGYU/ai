# Block 1: 커스텀 서브에이전트

## Phase A — 코드 작성 + 실행

### 코드

`src/m07-subagents/subagents.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M07: Subagents ===\n");

  for await (const message of query({
    prompt: `src/m01-hello/hello.ts 파일을 code-reviewer 에이전트를 사용해서 리뷰해줘.`,
    options: {
      tools: ["Read", "Glob", "Grep"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      agents: {
        "code-reviewer": {
          description: "TypeScript 코드를 리뷰합니다. 코드 품질, 에러 핸들링, 타입 안전성을 분석합니다.",
          prompt: `당신은 TypeScript 코드 리뷰어입니다.
파일을 읽고 다음을 분석하세요:
1. 코드 품질 (가독성, 구조)
2. 에러 핸들링
3. 개선 제안
결과를 3줄 이내로 요약하세요.`,
          tools: ["Read", "Glob", "Grep"],
        },
      },
    },
  })) {
    const msg = message as any;

    switch (msg.type) {
      case "assistant":
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");
        if (text) console.log(`🤖 ${text.slice(0, 300)}`);
        if (toolUses?.length > 0) {
          for (const tu of toolUses) {
            console.log(`🔧 ${tu.name}(${JSON.stringify(tu.input).slice(0, 80)})`);
          }
        }
        break;

      case "result":
        console.log(`\n✅ result: ${msg.result?.slice(0, 300)}`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        break;
    }
  }
}

main().catch(console.error);
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m07-subagents/subagents.ts
```

### 관찰 포인트

1. 메인 에이전트가 서브에이전트를 호출하는 과정이 메시지에 어떻게 나타나는가?
2. 서브에이전트의 도구 사용 (Agent tool_use)이 보이는가?
3. 서브에이전트의 결과가 메인에 어떻게 합쳐지는가?
4. 메인 에이전트가 서브에이전트의 `description`을 기반으로 선택했는가?

> ⛔ **STOP** — 실행 결과에서 서브에이전트 호출 과정을 알려주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> 메인 에이전트는 서브에이전트를 **도구처럼** 사용한다.
> `Agent` 도구로 서브에이전트를 호출하고, 결과를 받아서 자신의 응답에 통합한다.
> 서브에이전트는 독립된 컨텍스트에서 작업하므로 메인 대화가 깔끔하게 유지된다.

### 퀴즈

**Q1**: 서브에이전트에 `maxTurns: 3`을 설정하면 어떤 효과가 있는가?

**Q2**: 프롬프트에서 서브에이전트 이름을 언급하지 않으면 메인 에이전트가 알아서 선택하는가?

### 정답 가이드

- Q1: 서브에이전트가 최대 3턴까지만 실행. 비용 제어와 런어웨이 방지에 유용
- Q2: description을 기반으로 판단. 프롬프트에 명시하지 않아도 "코드 리뷰해줘"라는 요청에 `code-reviewer`를 선택할 수 있음

> Block 2에서 여러 서브에이전트를 동시에 사용합니다. "Block 2 시작"이라고 말해주세요.
