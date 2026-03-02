# Block 1: 감사 로그 — PostToolUse

## Phase A — 코드 작성 + 실행

### 코드

`src/m05-hooks/hooks.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

async function auditLogger(input: any, toolUseID: string | undefined) {
  const timestamp = new Date().toISOString();
  const toolName = input.tool_name ?? "unknown";
  const toolInput = JSON.stringify(input.tool_input ?? {}).slice(0, 100);
  const logLine = `${timestamp} | ${toolName} | ${toolInput}\n`;

  await appendFile("./audit.log", logLine);
  console.log(`  📋 [감사 로그] ${toolName}`);
  return {};
}

async function main() {
  console.log("=== M05: Hooks — 감사 로그 ===\n");

  for await (const message of query({
    prompt: "이 프로젝트의 파일 목록을 확인하고, package.json의 내용을 읽어줘.",
    options: {
      tools: ["Read", "Glob"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      hooks: {
        PostToolUse: [
          { matcher: ".*", hooks: [auditLogger] }
        ],
      },
    },
  })) {
    const msg = message as any;
    if (msg.type === "result") {
      console.log(`\n✅ 최종 결과: ${msg.result?.slice(0, 200)}`);
    }
  }

  console.log("\n📋 audit.log 파일을 확인하세요!");
}

main().catch(console.error);
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m05-hooks/hooks.ts
cat audit.log
```

### 관찰 포인트

1. `audit.log`에 어떤 내용이 기록되었는가?
2. 훅이 에이전트 루프를 방해하지 않고 동작하는가?
3. 각 도구 호출마다 `📋 [감사 로그]`가 출력되는가?
4. `matcher: ".*"` 대신 `matcher: "Read"`로 바꾸면?

> ⛔ **STOP** — `audit.log` 내용을 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> 훅은 에이전트 루프와 **동기적으로** 실행된다.
> PostToolUse 훅이 완료될 때까지 다음 턴이 진행되지 않는다.
> 따라서 훅에서 무거운 작업(네트워크 호출 등)을 하면 에이전트가 느려진다.

### 퀴즈

**Q1**: 감사 로그를 DB에 저장하려면 어떻게 확장하면 되는가?

**Q2**: `matcher: "Read|Glob"`으로 설정하면 다른 도구 사용은 로그에 안 남는가?

### 정답 가이드

- Q1: `auditLogger` 함수 내에서 DB 클라이언트를 사용하면 됨. TypeScript 함수이므로 어떤 비동기 작업이든 가능
- Q2: 맞다. matcher에 매칭되는 도구만 훅이 실행됨

> Block 2에서 PreToolUse로 도구를 차단합니다. "Block 2 시작"이라고 말해주세요.
