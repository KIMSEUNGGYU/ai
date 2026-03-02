# Block 2: 메시지 스트림 — 타입별 핸들링과 분석

## Phase A — 개념 + 실습

### 핵심 개념: 메시지 스트림의 구조

`query()`가 반환하는 메시지 스트림은 에이전트 루프의 **모든 것**을 담고 있다.

```
┌─────────────────────────────────────────────┐
│                메시지 스트림                   │
├──────────┬──────────────────────────────────┤
│ system   │ init: 세션 시작, 도구 목록         │
│          │ (에이전트의 "출생 신고")            │
├──────────┼──────────────────────────────────┤
│ assistant│ Claude의 응답 (텍스트 + 도구 호출)  │
│          │ content: [{type: "text"}, ...]    │
│          │ content: [{type: "tool_use"}, ...]│
├──────────┼──────────────────────────────────┤
│ tool_    │ 도구 실행 결과                     │
│ result   │ (Read 결과, Bash 출력 등)          │
├──────────┼──────────────────────────────────┤
│ result   │ success: 에이전트 루프 정상 종료    │
│          │ error: 에러 발생                   │
│          │ (비용, 시간, 턴 수 포함)            │
└──────────┴──────────────────────────────────┘
```

### 메시지 타입별 TypeScript 구조

```typescript
// system 메시지
{
  type: "system",
  subtype: "init",
  session_id: string,
  tools: string[],        // 사용 가능한 도구 이름 목록
}

// assistant 메시지
{
  type: "assistant",
  message: {
    model: string,        // 사용된 모델 (claude-opus-4-...)
    content: [
      { type: "text", text: string },       // 텍스트 응답
      { type: "tool_use", name: string, input: any },  // 도구 호출
    ],
  },
}

// result 메시지
{
  type: "result",
  subtype: "success" | "error",
  result: string,         // 최종 텍스트 결과
  num_turns: number,      // 총 에이전트 루프 턴 수
  total_cost_usd: number, // 총 비용 (USD)
  duration_ms: number,    // 전체 소요 시간
  duration_api_ms: number,// API 호출 시간
}
```

### 실습: 메시지 파싱 강화

`hello.ts`의 메시지 핸들링을 관찰하고, 다음을 시도해보자:

1. **프롬프트 변경**: `"What is 2 + 2?"` 대신 더 복잡한 질문으로 바꿔보기
   ```typescript
   prompt: "한국의 수도는 어디인지, 그 도시의 인구는 얼마인지 설명해줘."
   ```

2. **실행 후 비교**: 응답 길이, 비용, 시간이 어떻게 달라지는가?

```bash
unset CLAUDECODE && npx tsx src/m01-hello/hello.ts
```

### 관찰 포인트

1. 프롬프트가 복잡해지면 `total_cost_usd`가 변하는가?
2. `duration_ms`와 `duration_api_ms`의 차이는 무엇을 의미하는가?
3. 응답 텍스트 길이와 비용의 관계는?

> ⛔ **STOP** — 프롬프트를 바꿔서 실행해보고, Block 1과 비교한 결과를 알려주세요.

---

## Phase B — 피드백 + 종합 퀴즈

### 피드백 포인트

- **비용 변화**: 프롬프트와 응답 길이에 비례. 입력 토큰 + 출력 토큰 기준
- **duration_ms vs duration_api_ms**:
  - `duration_api_ms` = 순수 API 호출 시간
  - `duration_ms` = 전체 시간 (CLI 시작, 초기화, 도구 실행 포함)
  - 차이 = SDK 오버헤드 (CLI 서브프로세스 시작 비용)
- `num_turns`는 여전히 1 — 도구가 없으니 루프가 1턴

### M01 종합 퀴즈

**Q1**: 메시지 스트림에서 `assistant` 메시지의 `content` 배열에 `type: "text"`와 `type: "tool_use"`가 동시에 올 수 있는가? 그렇다면 어떤 상황에서?

**Q2**: `result` 메시지의 `subtype`이 `"error"`가 되는 경우는?

**Q3**: SDK의 비용은 어떻게 과금되는가? API 키 기반? 구독 기반?

### 정답 가이드

- Q1: 가능하다. Claude가 텍스트로 설명하면서 동시에 도구를 호출할 때 (예: "파일을 읽어보겠습니다" + Read 도구 호출). M02에서 직접 관찰한다.
- Q2: 에이전트가 비정상 종료할 때 (타임아웃, 퍼미션 거부, 내부 에러 등).
- Q3: SDK는 Claude Code CLI를 실행하므로 기존 구독(Max/Pro)을 사용한다. 별도 API 비용이 아니다. 다만 `total_cost_usd`에 추정 비용이 표시된다.

### M01 핵심 정리

```
query() ──→ 메시지 스트림 ──→ 에이전트의 모든 것을 관찰 가능

메시지 흐름: system/init → [assistant ↔ tool_result]* → result/success
                              └── 이 반복이 "에이전트 루프"
                              └── tools: []이면 반복 없이 바로 result
```

### 학습 노트 작성 안내

M01 학습을 마치며, 배운 내용을 정리하자:

```bash
# notes/m01-hello-agent.md 에 다음을 정리
# - query()의 역할
# - 메시지 스트림 타입 (system, assistant, result)
# - tools: []의 의미
# - SDK의 동작 원리 (CLI 서브프로세스)
# - 놀랐던 점 / 궁금한 점
```

### 다음 모듈 안내

> M01 완료! 다음 모듈 **M02: Tools**에서는 `tools` 옵션으로 에이전트에게 능력을 부여한다.
> 도구가 있는 에이전트는 루프가 **여러 턴**으로 확장되는 것을 직접 관찰한다.
> M02를 시작하려면 `/m02-tools`를 호출하세요. (교안은 추후 추가)
