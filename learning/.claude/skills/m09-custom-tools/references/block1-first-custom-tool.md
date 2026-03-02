# Block 1: 첫 커스텀 도구

## Phase A — 코드 작성 + 실행

### 코드

`src/m09-custom-tools/custom-tools.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// 커스텀 도구 정의
const getCurrentTime = {
  name: "get_current_time",
  description: "현재 시간을 특정 타임존 기준으로 반환합니다. 사용자가 시간이나 날짜를 물어볼 때 사용.",
  inputSchema: {
    type: "object" as const,
    properties: {
      timezone: {
        type: "string",
        description: "IANA 타임존 (예: Asia/Seoul, America/New_York)",
      },
    },
    required: ["timezone"],
  },
};

const getProjectInfo = {
  name: "get_project_info",
  description: "현재 프로젝트의 기본 정보(이름, 버전, 의존성 수)를 반환합니다.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

// 커스텀 도구 핸들러
function handleCustomTool(name: string, input: any): string {
  switch (name) {
    case "get_current_time":
      return new Date().toLocaleString("ko-KR", { timeZone: input.timezone });
    case "get_project_info":
      const pkg = require("../../package.json");
      return JSON.stringify({
        name: pkg.name,
        version: pkg.version,
        dependencies: Object.keys(pkg.dependencies || {}).length,
      });
    default:
      return `Unknown tool: ${name}`;
  }
}

async function main() {
  console.log("=== M09: Custom Tools ===\n");

  for await (const message of query({
    prompt: "지금 서울 시간이 몇 시인지, 그리고 이 프로젝트의 정보를 알려줘.",
    options: {
      tools: [],  // 빌트인 도구 없음
      customTools: [getCurrentTime, getProjectInfo],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    const msg = message as any;

    if (msg.type === "assistant") {
      const toolUses = msg.message?.content
        ?.filter((c: any) => c.type === "tool_use");
      const text = msg.message?.content
        ?.filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      if (toolUses?.length > 0) {
        for (const tu of toolUses) {
          console.log(`🔧 ${tu.name}(${JSON.stringify(tu.input)})`);
          const result = handleCustomTool(tu.name, tu.input);
          console.log(`   → ${result}`);
        }
      }
      if (text) console.log(`🤖 ${text.slice(0, 300)}`);
    }

    if (msg.type === "result") {
      console.log(`\n✅ turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
    }
  }
}

main().catch(console.error);
```

> **참고**: SDK의 `customTools` API는 실제 SDK 버전에 따라 다를 수 있습니다. 최신 SDK 문서를 확인하세요.

### 실행

```bash
unset CLAUDECODE && npx tsx src/m09-custom-tools/custom-tools.ts
```

### 관찰 포인트

1. 에이전트가 두 커스텀 도구를 모두 호출하는가?
2. `get_current_time`에 올바른 타임존을 전달하는가?
3. 빌트인 도구 없이 커스텀 도구만으로 작동하는가?
4. 에이전트가 도구 결과를 자연어로 변환하는가?

> ⛔ **STOP** — 커스텀 도구 실행 결과를 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> 커스텀 도구는 에이전트에게 **비즈니스 로직**을 노출하는 방법이다.
> 에이전트는 description을 읽고 언제 사용할지 판단하고, inputSchema에 맞는 파라미터를 생성한다.
> 이것은 "함수 호출"과 비슷하지만, **호출 시점을 에이전트가 결정**한다는 점이 다르다.

### 퀴즈

**Q1**: 커스텀 도구와 MCP 도구의 핵심 차이는?

### 정답 가이드

- Q1: 커스텀 도구는 같은 프로세스에서 직접 실행. MCP 도구는 별도 서버 프로세스. 커스텀 도구가 더 빠르고 간단하지만, MCP는 서버 재사용과 표준화의 장점

> Block 2에서 더 복합적인 도구를 설계합니다. "Block 2 시작"이라고 말해주세요.
