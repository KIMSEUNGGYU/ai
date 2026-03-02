# Block 0: 커스텀 도구 구조

## Phase A — 개념

### 핵심 개념

빌트인 도구(Read, Edit, Bash)는 SDK가 제공한다. **커스텀 도구**는 개발자가 직접 정의해서 에이전트에게 고유한 능력을 부여한다.

```
빌트인 도구: Read, Edit, Bash     → SDK 내장 (범용)
MCP 도구:   Playwright, Slack    → 외부 서버 (표준 프로토콜)
커스텀 도구: getPrice, sendEmail  → 개발자 정의 (비즈니스 로직)
```

### 커스텀 도구 정의 구조

```typescript
{
  name: "get_current_time",           // 도구 이름
  description: "현재 시간을 반환합니다",  // 에이전트가 읽는 설명
  inputSchema: {                      // JSON Schema (입력 파라미터 정의)
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "타임존 (예: Asia/Seoul)",
      },
    },
    required: ["timezone"],
  },
  handler: async (input) => {         // 실제 실행 로직
    const now = new Date().toLocaleString("ko-KR", { timeZone: input.timezone });
    return { result: now };
  },
}
```

### description의 중요성

에이전트는 `description`을 읽고 **언제 이 도구를 사용할지** 판단한다.

```
❌ description: "시간 도구"        → 모호함, 에이전트가 언제 써야 할지 모름
✅ description: "현재 시간을 특정 타임존 기준으로 반환합니다. 사용자가 시간을 물어볼 때 사용."
```

### 사전 질문

- 커스텀 도구의 `inputSchema`는 누가 사용하는가?
- 커스텀 도구와 Bash 도구의 차이는 무엇인가? (Bash에서도 시간을 얻을 수 있는데?)

> ⛔ **STOP** — 위 질문에 대한 생각을 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 피드백 포인트

- `inputSchema`: **에이전트(Claude)**가 읽고 올바른 파라미터를 생성하는 데 사용. JSON Schema 형식
- 커스텀 도구 vs Bash: 커스텀 도구는 (1) 안전함(임의 명령 실행 불가), (2) 타입 안전(schema 검증), (3) 의미 명확(description), (4) 재사용 가능

### 퀴즈

**Q1**: `inputSchema`에 `required`를 빈 배열로 두면 에이전트가 파라미터를 안 보낼 수 있는가?

### 정답 가이드

- Q1: 가능하다. `required: []`이면 모든 파라미터가 선택적. 에이전트가 필요하다고 판단하면 보내고, 아니면 생략

> Block 1에서 첫 커스텀 도구를 만듭니다. "Block 1 시작"이라고 말해주세요.
