---
tags:
  - ai-agent
  - claude-agent-sdk
  - harness
  - architecture
date: 2026-02-24
status: active
source: https://platform.claude.com/docs/en/agent-sdk/overview
---

# AI Agent Harness — Claude Agent SDK

## 1. Agent Harness란?

### 비유: 말 마구(Horse Harness)

Harness의 원래 뜻은 **말에게 씌우는 마구**. 말(LLM)이 아무리 강해도 마구(Harness) 없이는 마차를 끌 수 없다.

```
말(Horse) = LLM (Claude)         → 원천적 능력 (추론, 생성)
마구(Harness) = Agent Harness    → 능력을 제어하고 방향을 잡는 장치
마차(Carriage) = 실제 작업       → 코드 수정, 리서치, 자동화
마부(Driver) = 사용자/시스템      → 목적지와 규칙을 정하는 존재
```

> AI Agent Harness = LLM을 **자율적으로 도구를 사용하는 에이전트**로 만드는 실행 환경

### 하네스의 5축

```
         Tools (능력)
            │
            │    "뭘 할 수 있나?"
            │    Read, Edit, Bash, MCP...
            │
Hooks ──────┼────── Subagents
(감시)       │       (위임)
"언제 개입?"  │    "누구에게 맡기나?"
             │
   Prompt ───┼─── Sessions
   (성격)     │    (기억)
"어떻게 행동?" │  "이전 맥락은?"
```

| 축             | 역할          | 예시                                  |
| ------------- | ----------- | ----------------------------------- |
| **Tools**     | 에이전트의 능력    | Read, Edit, Bash, WebSearch, MCP 도구 |
| **Prompt**    | 에이전트의 성격·역할 | systemPrompt, CLAUDE.md             |
| **Hooks**     | 실행 감시·개입    | PreToolUse로 위험 명령 차단                |
| **Subagents** | 작업 위임       | code-reviewer, researcher 등         |
| **Sessions**  | 대화 상태 유지    | sessionId로 컨텍스트 이어가기                |

### 에이전트 루프 (Agent Loop)

하네스의 핵심은 **루프**. LLM이 "도구 호출"을 요청하면 실행하고, 결과를 돌려보내는 반복.

> GYU: 루프.. 그러면 ralph 까지 알아야하나? 아니면 ralph 가 어떻게 동작하는지 간단하게만 알아도 되나?? 핵심 내용 github 링크 달라고 하기? 

```
사용자 프롬프트
       │
       ▼
┌─── Agent Loop ──────────────────────┐
│                                      │
│  Claude 응답 ──→ 도구 호출 요청?      │
│       │              │               │
│       │ No           │ Yes           │
│       ▼              ▼               │
│    최종 응답      도구 실행            │
│                      │               │
│                      ▼               │
│                 결과를 Claude에       │
│                 돌려보냄 ──→ 반복     │
│                                      │
└──────────────────────────────────────┘
```

- **Client SDK**: 이 루프를 개발자가 직접 while문으로 구현
- **Agent SDK**: 루프가 내장, `query()` 한 줄이면 자동 실행
- **CLI (Claude Code)**: 루프 + TUI + 권한 관리까지 전부 포함

### 플러그인 vs 하네스 vs SDK

```
┌─────────────────────────────────────────────┐
│  Claude Code (하네스)                         │
│                                              │
│  ┌─ Plugin A ─┐  ┌─ Plugin B ─┐             │
│  │ skills/    │  │ agents/    │             │
│  │ hooks/     │  │ commands/  │             │
│  │ agents/    │  │ mcp/       │             │
│  └────────────┘  └────────────┘             │
│                                              │
│  에이전트 루프 ← Claude Code가 관리            │
│  도구 실행    ← Claude Code가 관리            │
│  권한 체크    ← Claude Code가 관리            │
└─────────────────────────────────────────────┘
          ↕ 비교
┌─────────────────────────────────────────────┐
│  나의 하네스 (Agent SDK로 구축)                │
│                                              │
│  에이전트 루프 ← 내가 제어                     │
│  도구 실행    ← 내가 제어                     │
│  권한 체크    ← 내가 제어                     │
│  서브에이전트  ← 내가 정의                     │
│  훅          ← 내가 정의                     │
└─────────────────────────────────────────────┘
```

**핵심 차이:**
- **플러그인** = 남의 하네스(Claude Code) 안에 **부품을 꽂는 것** (선언적, `.md` 파일)
- **SDK** = 하네스 자체를 **직접 만드는 것** (프로그래밍적, TypeScript/Python)

### SDK 방식의 장점

| 장점               | 플러그인으로는 불가능한 이유        |
| ---------------- | ---------------------- |
| **프로그래밍 가능한 루프** | 평가→재시도→자동 수정 같은 조건부 로직 |
| **프로덕션 배포**      | CI/CD, 서버, 크론잡에서 무인 실행 |
| **멀티에이전트 병렬**    | 여러 에이전트를 동시에 돌리고 결과 조합 |
| **외부 시스템 통합**    | DB, API, 메시지 큐와 직접 연동  |
| **커스텀 검증**       | 결과를 프로그래밍으로 검증 후 재시도   |

```typescript
// SDK 예: 평가 루프 (플러그인으로는 불가)
let result = await runAgent(task);
while (!passesEvaluation(result)) {
  result = await runAgent(task, { feedback: getErrors(result) });
}
```

### 아키텍처 다이어그램

```
┌─ Agent Harness ──────────────────────────────┐
│                                              │
│  ┌─ Context ─┐  ┌─ Tools ─┐  ┌─ Memory ─┐  │
│  │ 시스템 프롬프트│  │ Read     │  │ 세션 기록  │  │
│  │ 사용자 메시지  │  │ Edit     │  │ 프로젝트   │  │
│  │ 도구 결과    │  │ Bash     │  │ 컨텍스트   │  │
│  └───────────┘  │ WebSearch│  └──────────┘  │
│                  └─────────┘                 │
│  ┌─ Lifecycle ──┐  ┌─ Permissions ─┐        │
│  │ Hooks         │  │ allowedTools   │        │
│  │ Compaction    │  │ permissionMode │        │
│  │ Session Mgmt  │  │ bypassPerms    │        │
│  └──────────────┘  └───────────────┘        │
│                                              │
│  ┌─ Subagents ──────────────────────┐        │
│  │ 독립 컨텍스트에서 병렬 작업 수행      │        │
│  └──────────────────────────────────┘        │
└──────────────────────────────────────────────┘
```

## 2. Claude Agent SDK 개요

> Claude Code를 라이브러리로 제공 — 동일한 도구, 에이전트 루프, 컨텍스트 관리를 프로그래밍 가능하게.

| 항목    | 내용                                                 |
| ----- | -------------------------------------------------- |
| 언어    | TypeScript, Python                                 |
| 설치    | `npm install @anthropic-ai/claude-agent-sdk`       |
| 인증    | `ANTHROPIC_API_KEY` 환경변수                           |
| 대체 인증 | Amazon Bedrock, Google Vertex AI, Azure AI Foundry |

### SDK vs Client SDK vs CLI

```
┌──────────────────┬─────────────────┬────────────────┐
│   Client SDK     │   Agent SDK     │   CLI          │
├──────────────────┼─────────────────┼────────────────┤
│ 도구 루프 직접 구현│ 자율적 도구 실행   │ 대화형 인터페이스│
│ 낮은 추상화      │ 높은 추상화       │ 최고 추상화     │
│ 완전 커스텀      │ 프로그래밍 가능    │ 즉시 사용       │
│ API 직접 호출    │ 빌트인 도구 포함   │ 빌트인 전체     │
└──────────────────┴─────────────────┴────────────────┘
```

**Client SDK** — 도구 루프를 직접 구현:
```typescript
let response = await client.messages.create({ ...params });
while (response.stop_reason === "tool_use") {
  const result = yourToolExecutor(response.tool_use);
  response = await client.messages.create({ tool_result: result, ...params });
}
```

**Agent SDK** — Claude가 자율적으로 도구 사용:
```typescript
for await (const message of query({ prompt: "Fix the bug in auth.py" })) {
  console.log(message);
}
```

## 3. 에이전트 피드백 루프 (핵심 패턴)

Agent SDK의 에이전트는 3단계 루프를 반복:

```
    ┌──────────────┐
    │ 1. 맥락 수집   │ ← 파일 읽기, 검색, 서브에이전트 병렬 조사
    │  Gather Context│
    └──────┬───────┘
           ▼
    ┌──────────────┐
    │ 2. 행동 실행   │ ← 도구 호출, 코드 생성, MCP 통합
    │  Take Action  │
    └──────┬───────┘
           ▼
    ┌──────────────┐
    │ 3. 작업 검증   │ ← 린팅, 스크린샷, LLM 심사자
    │  Verify Work  │
    └──────┬───────┘
           │
           ▼ (필요시 반복)
```

### 3.1 맥락 수집 전략

| 방법          | 설명                     | 예시                  |
| ----------- | ---------------------- | ------------------- |
| **에이전트 검색** | bash로 대용량 파일 탐색        | `grep`, `tail`      |
| **서브에이전트**  | 병렬로 독립적 조사 수행          | Research Agent 패턴   |
| **컨팩션**     | SDK가 자동으로 이전 메시지 요약    | 장기 실행 에이전트          |
| **폴더 구조**   | 프로젝트 구조 자체가 컨텍스트 엔지니어링 | CLAUDE.md, .claude/ |

### 3.2 행동 실행

| 방법 | 설명 |
|------|------|
| **빌트인 도구** | Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch |
| **Bash & 스크립트** | PDF 변환, 데이터 처리 등 유연한 작업 |
| **코드 생성** | Python/TypeScript 작성하여 복잡한 작업 수행 |
| **MCP** | Slack, GitHub, Google Drive 등 외부 서비스 통합 |

### 3.3 작업 검증

| 방법          | 설명               | 비용  |
| ----------- | ---------------- | --- |
| **규칙 기반**   | 린팅, 형식 검증        | 낮음  |
| **시각적**     | HTML 렌더링 스크린샷 확인 | 중간  |
| **LLM 심사자** | 별도 모델이 톤/정확성 판단  | 높음  |

## 4. 핵심 기능 상세

### 4.1 Built-in Tools

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find all TODO comments and create a summary",
  options: { allowedTools: ["Read", "Glob", "Grep"] }
})) {
  if ("result" in message) console.log(message.result);
}
```

| 도구                  | 기능                |
| ------------------- | ----------------- |
| **Read**            | 워킹 디렉토리 내 파일 읽기   |
| **Write**           | 새 파일 생성           |
| **Edit**            | 기존 파일 정밀 수정       |
| **Bash**            | 터미널 명령, 스크립트, git |
| **Glob**            | 패턴으로 파일 찾기        |
| **Grep**            | 정규식으로 파일 내용 검색    |
| **WebSearch**       | 웹 검색              |
| **WebFetch**        | 웹 페이지 내용 파싱       |
| **AskUserQuestion** | 사용자에게 명확화 질문      |

### 4.2 Hooks (라이프사이클 제어)

에이전트 실행 중 핵심 시점에 커스텀 코드 실행:

```typescript
import { query, HookCallback } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

const logFileChange: HookCallback = async (input) => {
  const filePath = (input as any).tool_input?.file_path ?? "unknown";
  await appendFile("./audit.log",
    `${new Date().toISOString()}: modified ${filePath}\n`);
  return {};
};

for await (const message of query({
  prompt: "Refactor utils.py to improve readability",
  options: {
    permissionMode: "acceptEdits",
    hooks: {
      PostToolUse: [{ matcher: "Edit|Write", hooks: [logFileChange] }]
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

**사용 가능 훅**: `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`

### 4.3 Subagents (작업 위임)

```typescript
for await (const message of query({
  prompt: "Use the code-reviewer agent to review this codebase",
  options: {
    allowedTools: ["Read", "Glob", "Grep", "Task"],
    agents: {
      "code-reviewer": {
        description: "Expert code reviewer for quality and security reviews.",
        prompt: "Analyze code quality and suggest improvements.",
        tools: ["Read", "Glob", "Grep"]
      }
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

서브에이전트 메시지에는 `parent_tool_use_id` 필드가 포함되어 추적 가능.

### 4.4 MCP (외부 시스템 통합)

```typescript
for await (const message of query({
  prompt: "Open example.com and describe what you see",
  options: {
    mcpServers: {
      playwright: { command: "npx", args: ["@playwright/mcp@latest"] }
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

### 4.5 Sessions (대화 상태 유지)

```typescript
let sessionId: string | undefined;

// 1차 쿼리: 세션 ID 캡처
for await (const message of query({
  prompt: "Read the authentication module",
  options: { allowedTools: ["Read", "Glob"] }
})) {
  if (message.type === "system" && message.subtype === "init") {
    sessionId = message.session_id;
  }
}

// 2차 쿼리: 세션 이어서 진행 (컨텍스트 유지)
for await (const message of query({
  prompt: "Now find all places that call it",
  options: { resume: sessionId }
})) {
  if ("result" in message) console.log(message.result);
}
```

### 4.6 Permissions (권한 제어)

| 모드                  | 설명                    |
| ------------------- | --------------------- |
| `default`           | 기본 (위험 작업은 사용자 승인 필요) |
| `acceptEdits`       | 파일 편집 자동 승인           |
| `bypassPermissions` | 모든 도구 자동 승인           |
| `dontAsk`           | 승인 없이 불허              |
| `plan`              | 읽기 전용                 |

## 5. 데모 프로젝트 (공식)

> [github.com/anthropics/claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos)

| 데모                   | 설명            | 학습 포인트       |
| -------------------- | ------------- | ------------ |
| **Hello World**      | 기본 입문 예제      | SDK 기초       |
| **Simple ChatApp**   | 기본 채팅         | 세션 관리        |
| **Research Agent**   | 멀티에이전트 연구 시스템 | 서브에이전트 병렬 처리 |
| **Email Agent**      | IMAP 이메일 자동화  | MCP + 도구 통합  |
| **Excel Demo**       | 스프레드시트 작업     | 코드 생성 패턴     |
| **Resume Generator** | 이력서 생성        | 문서 생성 패턴     |

### Research Agent 아키텍처 (가장 고급 예제)

```
사용자 요청: "AI 에이전트 트렌드 조사"
           │
           ▼
    ┌─ 주제 분해 ─┐
    │ AI 에이전트 정의│
    │ 주요 프레임워크 │
    │ 활용 사례     │
    └──────┬───────┘
           │
     ┌─────┼─────┐
     ▼     ▼     ▼
  [Agent1][Agent2][Agent3]  ← 병렬 WebSearch
     │     │     │
     └─────┼─────┘
           ▼
    ┌─ 결과 종합 ─┐
    │ 상세 보고서   │
    └─────────────┘
```

## 6. 하네스 구축 팁

### 도구 설계 원칙
- 도구는 에이전트가 **가장 자주 사용할 행동**으로 설계
- 이름과 설명이 명확해야 Claude가 올바르게 선택
- 너무 많은 도구 → 혼란, 적절한 수로 제한

### 검증 파이프라인
```
코드 생성 → 린팅 → 테스트 실행 → (선택) LLM 심사
```
- TypeScript 추천: 타입 시스템이 에이전트에게 더 많은 피드백 제공
- 규칙 기반 검증을 우선, LLM 심사는 비용 대비 가치 판단

### 디버깅 & 개선
| 문제       | 해결                 |
| -------- | ------------------ |
| 작업 이해 실패 | 검색 API/도구 구조 개선    |
| 반복 실패    | 도구 호출에 형식 규칙 추가    |
| 오류 수정 불가 | 새 도구 제공            |
| 성능 변동    | 실제 사용 기반 테스트 세트 구축 |

## 7. Claude Code 기능 연동

`settingSources: ['project']` 설정 시 활용 가능:

| 기능 | 설명 | 위치 |
|------|------|------|
| **Skills** | 마크다운 기반 전문 능력 | `.claude/skills/SKILL.md` |
| **Commands** | 커스텀 슬래시 명령 | `.claude/commands/*.md` |
| **Memory** | 프로젝트 컨텍스트/지침 | `CLAUDE.md` |
| **Plugins** | 커맨드, 에이전트, MCP 서버 확장 | `plugins` 옵션 |

## References

- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Building Agents Blog Post](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)
- [SDK Demos (GitHub)](https://github.com/anthropics/claude-agent-sdk-demos)
- [TypeScript SDK (GitHub)](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Python SDK (GitHub)](https://github.com/anthropics/claude-agent-sdk-python)
- [DataCamp Tutorial](https://www.datacamp.com/tutorial/how-to-use-claude-agent-sdk)
