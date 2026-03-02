# Block 2: 실용 패턴

## Phase A — 설계

### 실용적 MCP 연동 패턴

**패턴 1: 웹 브라우저 에이전트 (Playwright)**

```typescript
mcpServers: {
  playwright: {
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-playwright@latest"],
  },
}
// → 웹 페이지 탐색, 폼 입력, 스크린샷 등
```

**패턴 2: 데이터베이스 에이전트 (SQLite)**

```typescript
mcpServers: {
  sqlite: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"],
  },
}
// → SQL 쿼리 실행, 테이블 탐색, 데이터 분석
```

**패턴 3: GitHub 연동 에이전트**

```typescript
mcpServers: {
  github: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN! },
  },
}
// → PR 리뷰, 이슈 분석, 코드 검색
```

### 설계 과제

다음 에이전트를 MCP를 활용해 설계해보자:

**"경쟁사 웹사이트 모니터링 에이전트"**
- 매일 경쟁사 웹사이트를 방문
- 가격 변화를 감지
- 변화가 있으면 Slack으로 알림
- 히스토리를 DB에 저장

어떤 MCP 서버 조합을 사용할지, `mcpServers` 옵션을 설계해보자.

> ⛔ **STOP** — MCP 서버 조합 설계를 공유해주세요.

---

## Phase B — 피드백 + 종합

### 모니터링 에이전트 설계 예시

```typescript
mcpServers: {
  playwright: {
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-playwright@latest"],
  },
  sqlite: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "./price-history.db"],
  },
  // Slack은 별도 MCP 서버 또는 Bash로 webhook 호출
}
```

### M08 종합 퀴즈

**Q1**: MCP 서버를 직접 만들 수 있는가? 어떤 언어로?

**Q2**: `mcpServers`와 `tools`를 동시에 설정하면 MCP 도구도 `tools` 필터에 영향을 받는가?

**Q3**: MCP 서버의 보안 위험은 무엇인가?

### 정답 가이드

- Q1: 가능하다. MCP는 표준 프로토콜이므로 TypeScript, Python 등 어떤 언어로든 서버 구현 가능. M09에서 Custom Tools를 배우고, 그 연장선에서 MCP 서버도 만들 수 있음
- Q2: `tools` 필터는 빌트인 도구에만 적용. MCP 도구는 별도. `disallowedTools`로 MCP 도구도 차단 가능
- Q3: MCP 서버가 서브프로세스로 실행되므로, 악의적 MCP 서버는 시스템 접근 가능. 신뢰할 수 있는 서버만 사용

### 학습 노트

```
notes/m08-mcp.md에 정리:
- MCP 아키텍처 (Client ↔ Server)
- mcpServers 옵션 구조
- 빌트인 vs MCP 도구의 차이
- 실용 MCP 패턴 (Playwright, SQLite, GitHub)
- 보안 고려사항
```

> M08 완료! 다음 **M09: Custom Tools**에서 나만의 도구를 만듭니다. `/m09-custom-tools`를 호출하세요.
