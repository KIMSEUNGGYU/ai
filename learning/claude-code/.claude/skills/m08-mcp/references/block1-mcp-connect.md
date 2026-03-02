# Block 1: MCP 서버 연결

## Phase A — 코드 작성 + 실행

### 코드

`src/m08-mcp/mcp.ts` — filesystem MCP 서버를 연결하는 예제:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M08: MCP — 외부 시스템 연동 ===\n");

  for await (const message of query({
    prompt: "현재 디렉토리의 파일 구조를 MCP filesystem 도구로 확인하고 설명해줘.",
    options: {
      tools: ["Read", "Glob"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      mcpServers: {
        filesystem: {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            process.cwd(),
          ],
        },
      },
    },
  })) {
    const msg = message as any;

    if (msg.type === "system" && msg.subtype === "init") {
      console.log(`📦 tools: ${msg.tools?.length}개`);
      console.log(`   도구 목록: ${msg.tools?.join(", ")}`);
    }

    if (msg.type === "assistant") {
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
    }

    if (msg.type === "result") {
      console.log(`\n✅ turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
    }
  }
}

main().catch(console.error);
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m08-mcp/mcp.ts
```

### 관찰 포인트

1. `system/init`의 도구 목록에 MCP 도구가 추가되었는가?
2. 빌트인 도구(Read, Glob)와 MCP 도구(filesystem_*)가 함께 보이는가?
3. 에이전트가 MCP 도구를 사용하는가, 빌트인 도구를 사용하는가?
4. MCP 도구 이름의 형식은? (`mcp__servername__toolname` 형태?)

> ⛔ **STOP** — MCP 연결 후 도구 목록과 에이전트의 도구 선택을 알려주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> MCP 서버를 연결하면 에이전트의 도구 목록이 **동적으로 확장**된다.
> 에이전트는 빌트인 도구와 MCP 도구를 **구분하지 않고** 최적의 도구를 선택한다.
> 하지만 MCP 도구 이름에는 서버 이름이 접두사로 붙어서 구분 가능.

### 퀴즈

**Q1**: MCP 서버가 실행 중 오류가 발생하면 에이전트는 어떻게 되는가?

**Q2**: 같은 기능의 빌트인 도구(Read)와 MCP 도구(filesystem_read)가 있으면 에이전트는 어떤 것을 선택하는가?

### 정답 가이드

- Q1: MCP 도구 호출이 실패하고, 에이전트가 에러를 받아서 다른 방법을 시도하거나 보고
- Q2: 상황에 따라 다르지만 보통 빌트인 도구를 선호. 빌트인이 더 빠르고 안정적이기 때문

> Block 2에서 실용적 MCP 패턴을 살펴봅니다. "Block 2 시작"이라고 말해주세요.
