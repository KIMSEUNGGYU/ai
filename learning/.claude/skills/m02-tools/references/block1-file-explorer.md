# Block 1: 파일 탐색 에이전트

## Phase A — 코드 작성 + 실행

### 코드 확인

`src/m02-tools/tools.ts`를 확인하거나 작성하자:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M02: Tools ===\n");

  let messageCount = 0;

  for await (const message of query({
    prompt: "이 프로젝트의 package.json을 읽고, 설치된 의존성 목록을 알려줘.",
    options: {
      tools: ["Read", "Glob"],    // 파일 읽기 + 검색 능력 부여
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    messageCount++;
    const msg = message as any;

    switch (msg.type) {
      case "assistant":
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content
          ?.filter((c: any) => c.type === "tool_use");
        if (text) console.log(`🤖 [${messageCount}] ${text.slice(0, 200)}`);
        if (toolUses?.length > 0) {
          for (const tu of toolUses) {
            console.log(`🔧 [${messageCount}] tool_use: ${tu.name}(${JSON.stringify(tu.input).slice(0, 100)})`);
          }
        }
        break;

      case "result":
        console.log(`\n✅ [${messageCount}] 최종 결과`);
        console.log(`   result: "${msg.result?.slice(0, 300)}"`);
        console.log(`   turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
        break;
    }
  }
}

main().catch(console.error);
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m02-tools/tools.ts
```

### 관찰 포인트

1. M01과 달리 `tool_use` 메시지가 나타나는가?
2. Claude가 어떤 도구를 선택했는가? (Read? Glob? 둘 다?)
3. 도구 호출 후 Claude의 응답이 어떻게 달라지는가?
4. `num_turns`가 1보다 큰가?
5. 메시지 흐름: `system/init → assistant(tool_use) → tool_result → assistant(text) → result`

> ⛔ **STOP** — 실행 결과를 공유해주세요. 특히 Claude가 어떤 도구를 어떤 순서로 사용했는지 알려주세요.

---

## Phase B — 피드백 + 퀴즈

### 예상 메시지 흐름

```
📦 system/init         → tools: ["Read", "Glob"] 확인
🤖 assistant           → tool_use: Read({"file_path": ".../package.json"})
🔧 tool_result         → package.json 내용
🤖 assistant           → "의존성 목록은 다음과 같습니다: ..."
✅ result/success      → turns: 2
```

### 핵심 인사이트

> 도구가 있으면 에이전트 루프가 **여러 턴**으로 확장된다.
> Claude가 "파일을 읽어야 한다" → Read 도구 호출 → 결과 받고 → 텍스트로 정리.
> 이것이 "에이전트"와 "LLM"의 근본적 차이다.

### 퀴즈

**Q1**: Claude가 Glob을 먼저 쓰지 않고 바로 Read를 사용했다면, 왜일까?

**Q2**: `num_turns`가 2라는 것은 무엇을 의미하는가?

### 정답 가이드

- Q1: "package.json"이라는 정확한 파일명을 알고 있으므로 검색(Glob) 없이 바로 읽기(Read)가 가능. 파일 위치가 불확실하면 Glob → Read 순서를 사용할 것
- Q2: 1턴(도구 호출+결과) + 1턴(최종 응답) = 2턴. 도구 호출이 추가 턴을 만듦

> Block 2에서 더 복잡한 프롬프트로 도구 선택 패턴을 관찰합니다. "Block 2 시작"이라고 말해주세요.
