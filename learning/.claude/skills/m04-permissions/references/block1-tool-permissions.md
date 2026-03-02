# Block 1: allowedTools / disallowedTools — 세밀한 제어

## Phase A — 코드 작성 + 실행

### 핵심 개념

`permissionMode`가 전체 정책이라면, `allowedTools`와 `disallowedTools`는 개별 도구 레벨의 미세 조정이다.

```typescript
options: {
  permissionMode: "default",       // 기본: 위험한 도구는 확인 요청
  allowedTools: ["Read", "Glob"],  // 이 도구는 자동 승인
  disallowedTools: ["Bash"],       // 이 도구는 절대 차단
}
```

### 코드

`src/m04-permissions/permissions.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== M04: Permissions ===\n");

  // 실험 1: Read만 허용, Bash 차단
  for await (const message of query({
    prompt: "package.json을 읽고 설명해줘. 가능하면 npm audit도 실행해줘.",
    options: {
      tools: ["Read", "Glob", "Bash"],
      disallowedTools: ["Bash"],     // Bash는 명시적으로 차단
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
      const toolUses = msg.message?.content
        ?.filter((c: any) => c.type === "tool_use");
      if (text) console.log(`🤖 ${text.slice(0, 200)}`);
      if (toolUses?.length > 0) {
        for (const tu of toolUses) {
          console.log(`🔧 tool_use: ${tu.name}`);
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
unset CLAUDECODE && npx tsx src/m04-permissions/permissions.ts
```

### 관찰 포인트

1. "npm audit도 실행해줘"라고 했지만 Bash가 차단되었다. 에이전트가 어떻게 대응하는가?
2. 에이전트가 "Bash를 사용할 수 없습니다"라고 명시적으로 말하는가?
3. `disallowedTools`에 있는 도구를 에이전트가 호출 시도하면 어떻게 되는가?

> ⛔ **STOP** — 실행 결과에서 Bash 차단에 대한 에이전트의 반응을 알려주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> `disallowedTools`로 차단된 도구를 에이전트가 호출하면, **도구 호출 자체가 거부**된다.
> 에이전트는 이 피드백을 받고 다른 방법을 시도하거나, 수행 불가를 보고한다.
> 이것이 안전장치의 핵심: 에이전트의 판단이 아니라 **시스템 레벨에서 차단**.

### 퀴즈

**Q1**: `tools: ["Read", "Bash"]` + `disallowedTools: ["Bash"]`면 실제 사용 가능한 도구는?

**Q2**: `allowedTools`와 `permissionMode: "bypassPermissions"`의 차이는?

### 정답 가이드

- Q1: Read만 사용 가능. `disallowedTools`가 `tools`보다 우선
- Q2: `bypassPermissions`는 모든 도구를 자동 승인. `allowedTools`는 특정 도구만 자동 승인하고 나머지는 사용자 확인 필요

> Block 2에서 프로덕션 안전장치 패턴을 설계합니다. "Block 2 시작"이라고 말해주세요.
