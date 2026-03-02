---
tags:
  - agent-harness
  - step1
date: 2026-03-01
---

# Step 1: Hello World — 에이전트 루프

## 핵심 개념

- **에이전트 루프**: 질문 → 도구 호출 → 결과 피드백 → 재응답의 반복
- `query()` 함수 하나로 루프 시작, 내부 과정이 **메시지 스트림**으로 흘러나옴
- `for await (const message of query({...}))` 패턴으로 스트림 소비

## 실행 결과

```
📦 [1] system/init     — 세션 시작, session_id, tools 69개(MCP)
🤖 [2] assistant       — "2 + 2 equals 4."
⬜ [3] rate_limit_event
✅ [4] result/success   — 1턴, $0.33
```

tool_use 없음 → 도구가 없어서 루프 1턴에 종료.

## 배운 것

1. **메시지 흐름**: system/init → assistant → rate_limit_event → result/success
2. **`tools: []` vs `allowedTools: []`** — 완전히 다른 의미
   - `tools: []` = 빌트인 도구 비활성화 (Read, Edit, Bash 등)
   - `allowedTools: []` = 자동승인 목록이 비었을 뿐 (도구 자체는 사용 가능)
3. **`tools: []`인데 69개?** — MCP 도구(Gmail, Slack 등)는 별도로 로드됨. 빌트인만 제어
4. **SDK 내부**: API 키가 아닌 Claude Code CLI를 서브프로세스로 spawn
5. **`CLAUDECODE` env**: Claude Code 세션 안에서 SDK 실행 시 `unset CLAUDECODE` 필요
6. **`allowDangerouslySkipPermissions: true`**: bypassPermissions 모드의 안전장치

## 핵심 인사이트

> 도구 없는 에이전트 = 단순 LLM API 호출.
> "에이전트"가 되려면 **도구(Tools)** 가 필요하다.
> 도구를 주면 루프가 여러 턴으로 확장된다.

## SDK 옵션

```typescript
query({
  prompt: string,
  options: {
    tools: [],                              // 빌트인 도구 제한
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    // model: "haiku",                      // 비용 절약 (Step 2부터 적용)
  }
})
```

## 다음: Step 2

tools에 도구를 부여하면 루프가 여러 턴으로 확장된다.
Claude가 스스로 어떤 도구를 쓸지 판단하는 것을 관찰.
+ model: "haiku"로 비용 절약.
