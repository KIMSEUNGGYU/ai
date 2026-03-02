# Block 0: MCP 아키텍처

## Phase A — 개념

### 핵심 개념

**MCP (Model Context Protocol)** = 에이전트의 도구를 외부로 확장하는 표준 프로토콜.

```
┌──────────────┐        MCP         ┌──────────────┐
│              │ ◄────────────────► │  Playwright  │  (브라우저)
│  나의 하네스  │ ◄────────────────► │  Database    │  (DB)
│  (Agent SDK) │ ◄────────────────► │  Slack       │  (메시징)
│              │ ◄────────────────► │  GitHub      │  (코드)
└──────────────┘                    └──────────────┘
        ↑                                  ↑
    MCP Client                        MCP Server
```

### 빌트인 도구 vs MCP 도구

| 구분 | 빌트인 도구 | MCP 도구 |
|------|-----------|----------|
| 예시 | Read, Edit, Bash, Glob | Playwright, Slack, GitHub |
| 출처 | SDK 내장 | 외부 MCP 서버 |
| 설정 | `tools: ["Read"]` | `mcpServers: { ... }` |
| 실행 | SDK 내부 | MCP 서버 프로세스 |

### MCP 서버 연결 방식

```typescript
mcpServers: {
  "server-name": {
    command: "npx",                    // 실행 명령
    args: ["@some/mcp-server"],        // 인자
    env: { KEY: "value" },             // 환경 변수
  }
}
```

SDK가 MCP 서버를 **서브프로세스**로 시작하고, 표준 프로토콜로 통신한다.

### 플러그인과의 관계

```
플러그인: .mcp.json 파일에 서버 설정 (선언적)
SDK:     mcpServers 옵션에 직접 설정 (프로그래밍적)
```

### 사전 질문

- MCP 서버 하나가 여러 도구를 제공할 수 있을까?
- 에이전트가 MCP 도구와 빌트인 도구를 동시에 사용할 수 있을까?

> ⛔ **STOP** — 위 질문에 대한 생각을 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 피드백 포인트

- MCP 서버 하나 = 여러 도구. 예: Playwright 서버 → navigate, click, screenshot, fill 등 여러 도구 제공
- 빌트인 + MCP 도구 동시 사용 가능. `tools`와 `mcpServers`를 함께 설정

### 퀴즈

**Q1**: MCP 서버가 제공하는 도구 이름은 누가 정하는가?

### 정답 가이드

- Q1: MCP 서버 개발자가 정한다. 에이전트는 서버가 제공하는 도구 목록을 자동으로 발견

> Block 1에서 실제 MCP 서버를 연결합니다. "Block 1 시작"이라고 말해주세요.
