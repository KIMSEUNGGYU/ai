---
tags:
  - ai-agent
  - claude-agent-sdk
  - harness
  - tutorial
  - hands-on
date: 2026-02-24
status: active
---

# Agent Harness 구축 튜토리얼

## 시나리오

> **상황**: Claude Code 플러그인으로 skills, agents, hooks, commands를 만들어봤다. 그런데 플러그인은 Claude Code라는 "남의 하네스" 안에서 부품을 꽂는 것뿐. 에이전트가 실패하면 자동으로 재시도하거나, 여러 에이전트를 동시에 돌려서 결과를 조합하거나, CI/CD에서 무인 실행하는 건 불가능하다.
>
> **미션**: Claude Agent SDK로 하네스를 직접 구축하면서, "하네스가 뭔지"를 체감하고, 궁극적으로 나만의 자율 에이전트 시스템을 만든다.

## 학습 프로세스

모든 Step은 동일한 3단계 흐름을 따른다:

```
📖 개념   →   🔨 실습   →   📝 정리
무엇을        코드 작성      배운 것 요약
왜            실행           핵심 인사이트
알게 될 것    관찰           다음 스텝 예고
```

## 전체 로드맵

| Part | Step | 주제 | 하네스 5축 | 상태 |
|:----:|:----:|------|:----------:|:----:|
| 1 | 1 | Hello World — 에이전트 루프 | 루프 | ✅ |
| 1 | 2 | Tools — 능력 부여 | **Tools** | ✅ |
| 2 | 3 | System Prompt — 역할 정의 | **Prompt** | ✅ |
| 2 | 4 | Hooks — 감사 로그 | **Hooks** | ✅ |
| 3 | 5 | Subagents — 병렬 코드 분석 | **Subagents** | ✅ |
| 3 | 6 | Sessions — 대화 이어가기 | **Sessions** | ✅ |
| 4 | 7 | MCP — 외부 시스템 연동 | 확장 | ✅ |
| 4 | 8 | 나만의 하네스 — 전체 통합 | 전체 | ✅ |

## 사전 준비

### 환경

```bash
cd ~/hq/15_Projects/agent-harness/project/

# Claude Code 세션 안에서 실행 시:
unset CLAUDECODE && npx tsx stepN-xxx.ts
```

### 핵심 배경 지식

**Agent Harness = LLM을 자율적 에이전트로 만드는 실행 환경**

```
말(Horse) = LLM (Claude)         → 원천적 능력 (추론, 생성)
마구(Harness) = Agent Harness    → 능력을 제어하고 방향을 잡는 장치
마차(Carriage) = 실제 작업       → 코드 수정, 리서치, 자동화
마부(Driver) = 사용자/시스템      → 목적지와 규칙을 정하는 존재
```

**하네스의 5축:**

```
         Tools (능력)
            │
Hooks ──────┼────── Subagents (위임)
(감시)       │
   Prompt ──┼─── Sessions (기억)
   (성격)
```

**플러그인 vs SDK:**

| | 플러그인 | SDK |
|---|---|---|
| 본질 | 남의 하네스에 부품 꽂기 | 하네스 자체를 직접 만들기 |
| 정의 | 선언적 (.md 파일) | 프로그래밍적 (TypeScript) |
| 루프 제어 | 불가 | 조건부 재시도, 평가 루프 가능 |
| 배포 | Claude Code 안에서만 | CI/CD, 서버, 크론잡 |

---

## Step 1: Hello World — 에이전트 루프

### 📖 개념

**에이전트 루프(Agent Loop)** — 하네스의 심장.

LLM이 "도구 호출"을 요청하면 실행하고, 결과를 돌려보내는 반복이다. SDK에서는 `query()` 함수 하나로 이 루프를 시작한다.

```
사용자 프롬프트
       │
       ▼
┌─── Agent Loop ──────────────────────────┐
│                                          │
│  Claude 응답 ──→ 도구 호출 요청?          │
│       │              │                   │
│       │ No           │ Yes               │
│       ▼              ▼                   │
│    최종 응답      도구 실행               │
│                      │                   │
│                      ▼                   │
│                 결과를 Claude에           │
│                 돌려보냄 ──→ 반복         │
└──────────────────────────────────────────┘
```

**이번 스텝에서 할 것:**
- `query()` API로 가장 단순한 에이전트를 실행한다
- 메시지 스트림의 구조를 관찰한다

**이번 스텝에서 알게 될 것:**
- `query()`가 반환하는 메시지 스트림의 타입들 (system, assistant, result)
- 도구 없는 에이전트는 단순 LLM API 호출과 동일하다는 것
- SDK가 실제로는 Claude Code CLI를 서브프로세스로 실행한다는 것

### 🔨 실습

**파일**: `project/step1-hello.ts`

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 1: Hello World Agent ===\n");

  for await (const message of query({
    prompt: "What is 2 + 2? Answer in one sentence.",
    options: {
      tools: [],           // 빌트인 도구 비활성화
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    // 메시지 타입별 관찰
    const msg = message as any;
    console.log(`[${msg.type}/${msg.subtype ?? ""}]`);
  }
}

main().catch(console.error);
```

**관찰 포인트:**
- 어떤 메시지 타입들이 출력되는가?
- `system/init` → `assistant` → `result/success` 순서로 오는가?
- `tool_use` 메시지가 나오는가? (안 나와야 정상)
- `system/init`에 tools 목록이 보이는가?

### 📝 정리

**배운 것:**
- `query()`가 에이전트 루프를 시작하고, 내부의 모든 과정을 **메시지 스트림**으로 내보냄
- 메시지 흐름: `system/init` → `assistant` → `rate_limit_event` → `result/success`
- `tools: []`로 빌트인 도구를 비활성화해도 MCP 도구(Gmail 등)는 로드됨
- SDK는 API 키가 아닌 Claude Code CLI를 spawn함 → `CLAUDECODE` env unset 필요
- 도구 없는 에이전트 = 단순 LLM 호출. **도구가 있어야 "에이전트"**

**핵심 인사이트:**
> 에이전트의 핵심은 루프다. `query()`는 "질문 → 응답" 한 번이 아니라,
> "질문 → 도구 호출 → 결과 피드백 → 재응답 → ..." 의 반복을 스트리밍한다.
> Step 1에서는 도구가 없어서 루프가 1턴에 끝났을 뿐이다.

**다음 스텝 예고:**
Step 2에서 `tools`(또는 프리셋)로 도구를 부여하면 루프가 **여러 턴**으로 확장된다.
Claude가 스스로 어떤 도구를 쓸지 판단하는 것을 관찰한다.

---

## Step 2: Tools — 에이전트에게 능력 부여

### 📖 개념

**Tools** — 에이전트가 "할 수 있는 것"을 정의한다.

도구를 주면 에이전트는 **스스로 판단해서** 어떤 도구를 쓸지 결정한다. 같은 도구를 줘도 프롬프트에 따라 행동이 달라진다 (Step 3에서 학습).

```
tools: []                        → 순수 LLM (대화만 가능)
tools: ["Read", "Glob", "Grep"]  → 코드베이스 탐색 에이전트
tools: ["Read", "Edit", "Bash"]  → 코드 수정 에이전트
```

**SDK의 도구 관련 옵션 3가지:**

| 옵션 | 역할 | 비유 |
|------|------|------|
| `tools` | 사용 **가능한** 도구 제한 | "이 도구만 쓸 수 있어" |
| `allowedTools` | 자동 승인 목록 | "이 도구는 물어보지 않고 써도 돼" |
| `disallowedTools` | 명시적 금지 | "이 도구는 절대 쓰지 마" |

> 플러그인에서는 도구를 Claude Code가 알아서 제공했다.
> SDK에서는 `tools`로 **정확히 어떤 능력을 줄지** 직접 제어한다.
> 이것이 "하네스를 직접 구축"하는 것의 의미.

**이번 스텝에서 할 것:**
- `tools` 옵션으로 Read, Glob 도구를 부여한다
- 에이전트에게 파일을 읽으라는 작업을 지시한다

**이번 스텝에서 알게 될 것:**
- 에이전트가 도구를 스스로 선택하는 과정
- `tool_use` → `tool_result` 메시지의 구조
- 에이전트 루프가 여러 턴으로 확장되는 모습
- `tools` vs `allowedTools`의 실제 차이

### 🔨 실습

**파일**: `project/step2-tools.ts` (작성 필요)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 2: Tools ===\n");

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

**실행:**
```bash
cd ~/hq/15_Projects/agent-harness/project/
unset CLAUDECODE && npx tsx step2-tools.ts
```

**관찰 포인트:**
- Step 1과 달리 `tool_use` 메시지가 나타나는가?
- Claude가 어떤 도구를 선택했는가? (Read? Glob? 둘 다?)
- 도구 결과를 받은 후 Claude의 응답이 어떻게 달라지는가?
- `num_turns`가 1보다 큰가?

### 📝 정리

**배운 것:**
- 도구를 부여하면 에이전트 루프가 다중 턴으로 확장 (1턴 → 3턴)
- Claude가 도구를 자율적으로 선택 (Glob→Read or Read→실패→Read)
- `user` 타입 메시지 = SDK가 tool_result를 Claude에 전달하는 내부 구조
- `mcpServers: {}`는 MCP 비활성화가 아님 — 추가만 가능, 기존 제거 불가
- MCP 도구 설명이 입력 토큰을 소비 → Haiku여도 비용 상승

**핵심 인사이트:**
> 같은 프롬프트 + 같은 도구여도 매번 다른 전략을 선택할 수 있다.
> 이것이 "에이전트"와 "함수 호출"의 차이.
> SDK의 `tools`는 빌트인만 제어하고, MCP는 독립적인 레이어.

**다음 스텝 예고:**
Step 3에서는 같은 도구를 주되, `systemPrompt`로 **역할을 다르게** 정의하면 행동이 어떻게 달라지는지 관찰한다.

---

## Step 3: System Prompt — 역할 정의

### 📖 개념

**System Prompt** — 에이전트의 "두뇌". 같은 도구를 줘도 프롬프트에 따라 행동이 완전히 달라진다.

```
┌─────────────────────────────────────────────────┐
│           같은 도구 (Read, Glob, Grep)            │
├─────────────────────────────────────────────────┤
│  systemPrompt: "코드 리뷰어"  → 버그/보안 취약점   │
│  systemPrompt: "문서 작성자"  → README 개선 제안    │
│  systemPrompt: "아키텍트"     → 구조 개선 제안      │
└─────────────────────────────────────────────────┘
```

플러그인의 `agents/*.md` 본문이 곧 System Prompt. SDK에서는 `systemPrompt` 옵션으로 프로그래밍적으로 제어한다.

**좋은 System Prompt의 구조:**
1. **역할** — "당신은 ~입니다"
2. **관점** — "다음 기준으로 분석하세요"
3. **출력 형식** — "마크다운으로 출력하세요"

**이번 스텝에서 할 것:**
- `systemPrompt`를 설정한 코드 리뷰어 에이전트를 만든다
- Step 2와 같은 도구인데 행동이 어떻게 달라지는지 비교한다

**이번 스텝에서 알게 될 것:**
- System Prompt가 에이전트의 행동을 근본적으로 결정한다는 것
- 프롬프트 구조(역할 + 관점 + 출력 형식)의 효과
- 플러그인의 agents/*.md가 실제로 어떤 역할을 하는지

### 🔨 실습

**파일**: `project/step3-prompt.ts` (작성 필요)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 3: 코드 리뷰어 에이전트 ===\n");

  for await (const message of query({
    prompt: "step1-hello.ts 파일을 리뷰해줘.",
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
  }
}

main().catch(console.error);
```

**실행:**
```bash
unset CLAUDECODE && npx tsx step3-prompt.ts
```

**관찰 포인트:**
- Step 2와 같은 도구인데 행동이 어떻게 달라지는가?
- System Prompt의 구조(역할 + 관점 + 출력 형식)가 결과에 미치는 영향
- `systemPrompt`를 "당신은 주니어 개발자 멘토입니다"로 바꾸면? (실험)

### 📝 정리

**배운 것:**
- `systemPrompt`로 에이전트의 분석 관점과 출력 형식을 결정
- 같은 도구(Read, Glob, Grep)인데 Step 2(나열)와 Step 3(구조화된 리뷰)이 완전히 다른 행동
- assistant 메시지가 스트리밍 특성상 한 턴에 2번 옴 (empty → content 확정)

**핵심 인사이트:**
> System Prompt는 **가이드이지 템플릿이 아니다.**
> 프롬프트에서 "1→2→3" 순서로 지시해도 LLM이 심각도 순으로 재정렬하고, 요청 안 한 섹션을 추가한다.
> 매 실행마다 다른 구조 — 정확한 형식이 필요하면 few-shot 예시 필수.
> 맥락(학습용 코드)을 주지 않으면 프로덕션 기준으로 판단.

**다음 스텝 예고:**
Step 4에서는 Hooks로 에이전트의 도구 사용을 **감시**한다. 언제 어떤 도구를 썼는지 로깅하고, 위험한 명령은 차단하는 "안전장치"를 만든다.

---

## Step 4: Hooks — 에이전트 감시자

### 📖 개념

**Hooks** — 에이전트 루프의 **특정 시점에 개입**하는 콜백 함수.

```
사용자 프롬프트
       │
       ▼
  Claude 응답 → 도구 호출 요청
       │
  ┌────▼────┐
  │PreToolUse│ ← 도구 실행 전: 차단/수정 가능
  └────┬────┘
       ▼
    도구 실행
       │
  ┌────▼─────┐
  │PostToolUse│ ← 도구 실행 후: 감사 로그, 알림
  └────┬─────┘
       ▼
    결과 피드백 → 반복
```

| 훅 | 시점 | 용도 |
|----|------|------|
| `PreToolUse` | 도구 실행 **전** | 위험한 명령 차단, 입력 검증 |
| `PostToolUse` | 도구 실행 **후** | 감사 로그, 변경 추적 |
| `Stop` | 에이전트 종료 시 | 결과 검증, 정리 작업 |

**플러그인 훅 vs SDK 훅:**

| 구분 | 플러그인 훅 | SDK 훅 |
|------|-----------|--------|
| 정의 | `.claude/hooks/*.json` | TypeScript 함수 |
| 로직 | 셸 명령어 | 프로그래밍 가능 (async, DB, API...) |
| 제어력 | 차단/허용 | 차단/허용 + 메시지 수정 + 비동기 작업 |

**SDK 훅 콜백 시그니처:**
```typescript
(input: HookInput, toolUseID: string | undefined, options: { signal: AbortSignal })
  => Promise<HookJSONOutput>
```

**이번 스텝에서 할 것:**
- `PostToolUse` 훅으로 모든 도구 사용을 `audit.log` 파일에 기록한다
- `matcher`로 특정 도구만 필터링하는 법을 익힌다

**이번 스텝에서 알게 될 것:**
- 훅이 에이전트 루프에 어떻게 개입하는지
- `PreToolUse`로 도구 사용을 차단하는 "안전장치" 패턴
- SDK 훅이 플러그인 훅보다 강력한 이유

### 🔨 실습

**파일**: `project/step4-hooks.ts` (작성 필요)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

async function auditLogger(input: any, toolUseID: string | undefined) {
  const timestamp = new Date().toISOString();
  const toolName = input.tool_name ?? "unknown";
  const logLine = `${timestamp} | ${toolName} | ${JSON.stringify(input.tool_input ?? {}).slice(0, 100)}\n`;

  await appendFile("./audit.log", logLine);
  console.log(`  📋 [감사 로그] ${toolName}`);
  return {};
}

async function main() {
  console.log("=== Step 4: Hooks — 감사 로그 ===\n");

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
      console.log("\n✅ 최종 결과:", msg.result?.slice(0, 200));
    }
  }

  console.log("\n📋 audit.log 파일을 확인하세요!");
}

main().catch(console.error);
```

**실행:**
```bash
unset CLAUDECODE && npx tsx step4-hooks.ts
cat audit.log
```

**관찰 포인트:**
- `audit.log`에 어떤 내용이 기록되었는가?
- 훅이 에이전트 루프를 방해하지 않고 동작하는가?
- `matcher: ".*"` 대신 `matcher: "Edit|Write"`로 바꾸면?

**보너스 실험 — PreToolUse로 차단하기:**
```typescript
// PreToolUse 훅에서 blocked를 반환하면 도구 실행이 차단된다
async function blockDangerousTools(input: any) {
  if (input.tool_name === "Bash") {
    return { blocked: true, reason: "Bash 실행은 금지됩니다" };
  }
  return {};
}
```

### 📝 정리

**배운 것:**
- PostToolUse 훅으로 모든 도구 사용을 audit.log에 기록 — 에이전트 루프에 투명하게 동작
- PreToolUse 훅으로 Read 도구 차단 실험 — `{ blocked: true }` 반환으로 도구 실행 거부
- 차단해도 Claude가 MCP 등 대체 경로로 우회하는 행동 관찰
- SDK 훅(TypeScript 함수) vs 플러그인 훅(셸 명령어) — 둘 다 가능하지만 SDK가 유연

**핵심 인사이트:**
> PostToolUse = 구경꾼 (관찰만), PreToolUse = 경비원 (차단 가능).
> 하지만 에이전트는 한 경로가 막히면 우회한다 — 완전한 차단이 필요하면 모든 경로를 막아야 한다.
> SDK 훅의 가치는 "셸 vs TypeScript"가 아니라, 프로그래밍 가능한 제어(async, 상태 유지, 조건 분기).

**다음 스텝 예고:**
Step 5에서는 Subagents로 작업을 **위임**한다. 메인 에이전트가 서브에이전트를 생성하고, 각각 독립된 컨텍스트에서 병렬로 작업하는 패턴을 익힌다.

---

## Step 5: Subagents — 병렬 코드 분석

### 📖 개념

**Subagent = Claude의 분신. 독립된 컨텍스트에서 작업 수행.**

```
순차 실행: [파일1 분석] → [파일2 분석] → [파일3 분석]  (느림)

병렬 실행:
  ├── Sub-agent 1: 파일1 분석 중...
  ├── Sub-agent 2: 파일2 분석 중...
  └── Sub-agent 3: 파일3 분석 중...    (3배 빠름!)
```

**Subagent의 장점:**

| 장점 | 설명 |
|------|------|
| 병렬 처리 | 독립적인 작업을 동시에 실행 |
| 전문화 | 특정 작업에 특화된 에이전트 생성 |
| 컨텍스트 분리 | 각 Sub-agent가 독립된 컨텍스트 → 메인 대화는 깔끔 |

**SDK `agents` 옵션의 구조:**
```typescript
agents: {
  "agent-name": {
    description: string,  // 자연어 설명 (메인 에이전트가 읽음)
    prompt: string,       // System Prompt
    tools?: string[],     // 사용 가능한 도구 (생략 시 부모 상속)
    model?: string,       // 모델 (생략 시 부모 상속)
    maxTurns?: number,    // 턴 수 제한
  }
}
```

**Skill vs Sub-agent — 무엇이 다른가?**

| 구분 | Skill (플러그인) | Sub-agent (SDK) |
|------|----------------|-----------------|
| 정의 방식 | `.md` 파일 (선언적) | TypeScript 객체 (프로그래밍) |
| 병렬 실행 | 불가 | **가능** |
| 컨텍스트 | 메인 대화와 공유 | **독립** |

**이번 스텝에서 할 것:**
- 커스텀 서브에이전트 `code-reviewer`를 정의한다
- 메인 에이전트가 서브에이전트에게 파일 리뷰를 위임하게 한다

**이번 스텝에서 알게 될 것:**
- 서브에이전트 정의 방식 (description, prompt, tools)
- 메인 에이전트가 서브에이전트를 호출하는 과정
- 서브에이전트 결과가 메인에 합쳐지는 흐름

### 🔨 실습

**파일**: `project/step5-subagents.ts` (작성 필요)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 5: Subagents ===\n");

  for await (const message of query({
    prompt: `이 프로젝트의 step1-hello.ts 파일을
code-reviewer 에이전트를 사용해서 리뷰해줘.`,
    options: {
      tools: ["Read", "Glob", "Grep"],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      agents: {
        "code-reviewer": {
          description: "TypeScript 코드를 리뷰합니다.",
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
    console.log(`[${msg.type}]`, JSON.stringify(msg, null, 2).slice(0, 300));
    console.log("---");
  }
}

main().catch(console.error);
```

**관찰 포인트:**
- 서브에이전트가 호출되는 과정이 메시지에 어떻게 나타나는가?
- 서브에이전트의 결과가 메인에 어떻게 합쳐지는가?
- 메인 에이전트는 서브에이전트의 `description`을 보고 판단한다

### 📝 정리

**배운 것:**
- 서브에이전트는 내부적으로 `Task` 도구로 호출됨
- `tools` 화이트리스트에 Task가 없으면 서브에이전트 호출 불가 → `tools` 생략해야 함
- `tools` 생략 ≠ `tools: []`. 생략=전부 허용, `[]`=전부 차단
- user 메시지를 까보면 서브에이전트의 작업 과정과 최종 결과가 보임
- 메인 vs 서브에이전트 구분은 메시지 자체에 없고, Task 호출~결과 사이를 흐름으로 추론

**핵심 인사이트:**
> 서브에이전트의 가치는 **컨텍스트 분리**. 리뷰 상세가 메인 대화를 오염시키지 않고,
> 메인은 결과만 받아서 종합한다. Step 3(systemPrompt)은 메인이 직접 분석하지만,
> Step 5(subagent)는 위임 후 결과만 전달받는 구조.

**다음 스텝 예고:**
Step 6에서는 Sessions로 대화의 **기억**을 유지한다. 세션 ID를 캡처해서 이전 대화 맥락을 이어가는 패턴을 익힌다.

---

## Step 6: Sessions — 대화 이어가기

### 📖 개념

**Session = 에이전트의 기억 장치.** 대화 컨텍스트를 유지하고 이어갈 수 있다.

```
1차 쿼리: "인증 모듈을 읽어줘" → sessionId 캡처
                                      │
2차 쿼리: "그 모듈을 호출하는 곳은?"  ← resume: sessionId
         (1차 대화 맥락을 기억한 채로 답변)
```

**세션의 실용적 활용:**
- 긴 작업을 여러 쿼리로 나눠서 진행
- 중간에 사용자 피드백 받고 이어서 진행
- 세션 포크: 같은 맥락에서 다른 방향 탐색

**이번 스텝에서 할 것:**
- 1차 쿼리에서 세션 ID를 캡처한다
- 2차 쿼리에서 `resume` 옵션으로 대화를 이어간다

**이번 스텝에서 알게 될 것:**
- `system/init` 메시지에서 세션 ID를 캡처하는 방법
- `resume` 옵션으로 이전 맥락을 유지하는 것
- 세션이 "대화의 기억"이라는 것이 체감

### 🔨 실습

**파일**: `project/step6-sessions.ts` (작성 필요)

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
      console.log("[1차 결과]", msg.result?.slice(0, 200));
    }
  }

  // === 2차 쿼리: 세션 이어서 질문 ===
  console.log("\n=== 2차 쿼리: 이전 맥락 기반 질문 ===\n");

  for await (const message of query({
    prompt: "방금 읽은 의존성 중 @anthropic-ai/claude-agent-sdk의 버전은?",
    options: {
      resume: sessionId,  // 이전 세션 이어가기
    },
  })) {
    const msg = message as any;
    if (msg.type === "result") {
      console.log("[2차 결과]", msg.result?.slice(0, 200));
    }
  }
}

main().catch(console.error);
```

**관찰 포인트:**
- 2차 쿼리에서 "방금 읽은"이라고 했는데 정확히 답하는가?
- `resume` 없이 2차 쿼리를 하면 어떻게 되는가? (실험)

### 📝 정리

**배운 것:**
- `system/init`에서 `session_id` 한 번 발행 — 이후 메시지에는 없음
- `resume`은 대화 기록만 이어가고, `tools`/`model` 등 실행 옵션은 매번 새로 지정 필요
- resume 유무 대조 실험: resume O → 기억에서 즉답, resume X → "뭘 읽었는지 모르겠다"
- `forkSession: true`로 같은 지점에서 분기 가능 (SDK 문서)
- resume해도 이전 대화 토큰이 입력에 포함되어 비용 절감 효과는 없음

**핵심 인사이트:**
> Sessions는 나머지 4축(Tools, Prompt, Hooks, Subagents)과 성격이 다르다.
> 4축은 "한 번의 실행을 어떻게 잘 할 것인가"이고, Sessions는 "여러 번의 실행을 어떻게 연결할 것인가".
> `resume`은 대화 맥락만 이어가고 실행 옵션은 리셋된다 — 세션의 정체성은 "설정"이 아니라 "기억".

**다음 스텝 예고:**
Step 7에서는 MCP로 에이전트의 도구를 **외부로 확장**한다. 빌트인 도구(Read, Glob)를 넘어서, 브라우저/DB/API 등 외부 시스템을 연결한다.

---

## Step 7: MCP — 외부 시스템 연동

### 📖 개념

**MCP (Model Context Protocol)** = 에이전트의 도구를 외부로 확장하는 표준 프로토콜.

```
┌──────────────┐        MCP         ┌──────────────┐
│              │ ◄────────────────► │  Playwright  │
│  나의 하네스  │ ◄────────────────► │  Database    │
│  (Agent SDK) │ ◄────────────────► │  Slack       │
│              │ ◄────────────────► │  GitHub      │
└──────────────┘                    └──────────────┘
```

SDK의 `mcpServers` 옵션으로 MCP 서버를 연결하면, 에이전트의 도구 목록이 **동적으로 확장**된다.

```typescript
mcpServers: {
  playwright: {
    command: "npx",
    args: ["@anthropic-ai/mcp-playwright@latest"],
  },
}
```

**이번 스텝에서 할 것:**
- MCP 서버(Playwright)를 연결해 웹 페이지를 탐색할 수 있는 에이전트를 만든다

**이번 스텝에서 알게 될 것:**
- `mcpServers` 옵션의 구조 (command, args)
- MCP 도구와 빌트인 도구의 차이
- MCP가 하네스의 확장 포인트라는 것

### 🔨 실습

**파일**: `project/step7-mcp.ts` (작성 필요)

**사전 설치:**
```bash
npx playwright install chromium  # 최초 1회
```

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("=== Step 7: MCP — 웹 자동화 ===\n");

  for await (const message of query({
    prompt: "https://example.com을 열고 페이지 내용을 설명해줘.",
    options: {
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      mcpServers: {
        playwright: {
          command: "npx",
          args: ["@anthropic-ai/mcp-playwright@latest"],
        },
      },
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
  }
}

main().catch(console.error);
```

**관찰 포인트:**
- MCP 서버가 추가한 도구들이 무엇인가?
- 기존 빌트인 도구(Read, Glob)와 MCP 도구의 차이는?

### 📝 정리

**배운 것:**
- `mcpServers` 옵션으로 외부 MCP 서버를 세션에 추가 연결 가능
- MCP 도구 이름 규칙: `mcp__{서버명}__{도구명}` (예: `mcp__playwright__browser_click`)
- `tools: []`는 빌트인만 차단, MCP는 독립 레이어로 항상 로드됨
- 글로벌 MCP(`~/.claude/mcp.json`)와 SDK 세션 MCP(`mcpServers`)는 별도 — 추가만 가능
- 튜토리얼의 `@anthropic-ai/mcp-playwright`는 미존재 → 실제: `@playwright/mcp`
- Playwright MCP가 22개 도구 제공 (navigate, click, snapshot, evaluate, fill_form 등)
- `tools` 생략 시 빌트인 21 + MCP 91 = 112개 도구 풀, 에이전트가 자동 구분 사용

**핵심 인사이트:**
> MCP는 하네스 5축의 별도 축이 아니라 **tools의 확장점**.
> 빌트인이 "태어날 때 가진 능력"이라면, MCP는 "후천적으로 장착하는 능력".
> 에이전트는 MCP와 빌트인을 자연스럽게 조합한다 — 웹 작업은 Playwright, 로컬 저장은 Write.
> 112개 도구 중 필요한 5개만 선택하는 판단력이 에이전트의 핵심 가치.

**다음 스텝 예고:**
Step 8에서는 Step 1~7을 전부 조합한 **나만의 하네스**를 구축한다. 플러그인으로는 절대 불가능한 "평가 루프" 패턴을 구현한다.

---

## Step 8: 나만의 하네스 — 전체 통합

### 📖 개념

SDK의 진정한 힘은 **프로그래밍 가능한 루프**:

```
┌─────── 평가 루프 ────────────────────────┐
│                                          │
│  에이전트 실행 ──→ 결과 검증              │
│       ↑              │                   │
│       │         Pass? │                  │
│       │              │                   │
│       │ No           │ Yes               │
│       │              ▼                   │
│    피드백 반영    최종 결과 반환           │
└──────────────────────────────────────────┘
```

```typescript
// 이것이 플러그인으로는 절대 불가능한 패턴
let result = await runAgent(task);
while (!passesEvaluation(result)) {
  result = await runAgent(task, { feedback: getErrors(result) });
}
```

**이번 스텝에서 할 것:**
- Step 1~7을 조합해서 "평가 루프가 있는 코드 리뷰 시스템"을 구축한다

**구축할 시스템:**
```
사용자 요청 → 코드 리뷰어 에이전트 (systemPrompt + tools + hooks)
                    │
                    ▼
              품질 검증 (코드 예시, 심각도, 개선 제안 포함?)
              ┌────┴────┐
              │ No      │ Yes
              ▼         ▼
          피드백 반영   최종 결과
          → 재리뷰
```

**이번 스텝에서 알게 될 것:**
- Step 1~7의 모든 개념이 하나의 시스템으로 통합되는 경험
- 평가 루프 패턴 — 하네스만의 고유 가치
- "하네스 = Tools + Prompt + Hooks + Subagents + Sessions"의 체감

### 🔨 실습

**파일**: `project/step8-harness.ts` (스스로 설계!)

이 미션은 Step 1~7에서 배운 것을 조합해서 직접 설계한다:
- `query()` — 에이전트 루프 (Step 1)
- `tools` — 능력 부여 (Step 2)
- `systemPrompt` — 역할 정의 (Step 3)
- `hooks` — 감사 로그 (Step 4)
- `agents` — 서브에이전트 위임 (Step 5)
- `resume` — 세션 이어가기 (Step 6)
- `mcpServers` — 확장 (Step 7, 선택)

**평가 함수 힌트:**
```typescript
function evaluateReview(result: string): { pass: boolean; feedback: string } {
  const hasCodeExamples = result.includes("```");
  const hasSeverity = /심각|중요|낮음|높음/i.test(result);
  const hasSuggestions = result.includes("제안") || result.includes("개선");

  if (hasCodeExamples && hasSeverity && hasSuggestions) {
    return { pass: true, feedback: "" };
  }
  return {
    pass: false,
    feedback: `누락: ${!hasCodeExamples ? "코드 예시 " : ""}${!hasSeverity ? "심각도 " : ""}${!hasSuggestions ? "개선 제안" : ""}`,
  };
}
```

### 📝 정리

**배운 것:**
- 이중 루프 구조: `query()` 에이전트 루프 + TypeScript `for` 평가 루프
- `tools` 생략 필수 — Task(서브에이전트 호출 도구)가 화이트리스트에 없으면 서브에이전트 호출 불가
- 공통 옵션을 변수로 분리 — resume 시에도 tools/agents/hooks 재지정 필요 (Step 6 교훈)
- 평가 함수는 결정론적(TypeScript) vs 비결정적(LLM) — 하네스는 둘의 조합
- 피드백 과보정 현상 — LLM이 "부족" 피드백에 과잉 반응 (코드블록 8→50개)
- 프롬프트에 없던 기준(보안 분석)도 평가 루프 피드백이 런타임에 보정

**핵심 인사이트:**
> 평가 루프의 진정한 가치는 "프롬프트 설계의 불완전성을 런타임에 보정"하는 것.
> systemPrompt에 "보안 분석"을 깜빡해도, evaluateReview()가 감지하고 피드백으로 보완 지시.
> 프롬프트 엔지니어링만으로 완벽할 수 없다 — 평가 루프가 이 한계를 구조적으로 해결.
> 이것이 플러그인(1회 실행)으로는 불가능하고, 하네스(프로그래밍 가능한 루프)만의 고유 가치.

---

## 최종 체크리스트

| Step | 개념 | SDK 옵션 | 플러그인 대응 | 완료 |
|:----:|------|----------|:-------------|:----:|
| 1 | 에이전트 루프 | `query()` | Claude Code 내장 | ✅ |
| 2 | 도구 제어 | `tools` | 없음 (자동) | ✅ |
| 3 | 역할 정의 | `systemPrompt` | `agents/*.md` 본문 | ✅ |
| 4 | 라이프사이클 훅 | `hooks` | `hooks/*.json` | ✅ |
| 5 | 작업 위임 | `agents` | `agents/*.md` 선언적 | ✅ |
| 6 | 대화 상태 | `resume` | 없음 (자동) | ✅ |
| 7 | 외부 확장 | `mcpServers` | `.mcp.json` | ✅ |
| 8 | 통합 하네스 | 전체 조합 | **불가** | ✅ |

## 문제 해결

| 에러 | 원인 | 해결 |
|------|------|------|
| `Claude Code cannot be launched inside another Claude Code session` | Claude Code 세션 안에서 실행 | `unset CLAUDECODE` |
| `process exited with code 1` | 위와 동일하거나 인증 문제 | 디버그 로그 확인: `DEBUG_CLAUDE_AGENT_SDK=1` |
| `Module not found` | SDK 미설치 | `cd project && npm install` |
| 비용이 걱정 | Opus 기본 $0.33/call | `model: "haiku"` 설정 |

## 관련 노트

- [[ai-agent-harness-claude-agent-sdk]] — SDK 레퍼런스 + 하네스 개념 상세
- [[ouroboros-deep-analysis]] — Ouroboros 코드 분석 (하네스 고급 사례)

## 더 알아보기

| 주제 | 링크 |
|------|------|
| Agent SDK Overview | https://platform.claude.com/docs/en/agent-sdk/overview |
| SDK TypeScript GitHub | https://github.com/anthropics/claude-agent-sdk-typescript |
| SDK Demos | https://github.com/anthropics/claude-agent-sdk-demos |
