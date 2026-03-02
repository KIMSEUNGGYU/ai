# Block 0: 평가 루프 — SDK만의 고유 가치

## Phase A — 개념

### 핵심 개념

SDK의 진정한 힘은 **프로그래밍 가능한 루프**. 플러그인에서는 절대 불가능한 패턴이다.

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

### 평가 루프 코드

```typescript
// 이것이 플러그인으로는 절대 불가능한 패턴
let sessionId: string | undefined;
let result = "";
let attempt = 0;

while (attempt < 3) {
  attempt++;
  for await (const msg of query({
    prompt: attempt === 1
      ? "이 파일을 리뷰해줘"
      : `이전 리뷰에 다음이 누락되었습니다: ${feedback}. 보완해줘.`,
    options: {
      resume: sessionId,  // 이전 맥락 유지
      tools: ["Read", "Glob"],
      ...
    },
  })) {
    if (msg.type === "system") sessionId = msg.session_id;
    if (msg.type === "result") result = msg.result;
  }

  const evaluation = evaluate(result);
  if (evaluation.pass) break;
  feedback = evaluation.feedback;
}
```

### 플러그인 vs SDK: 왜 이것이 불가능한가?

```
플러그인: Claude Code가 루프를 제어 → 사용자가 루프에 개입 불가
SDK:     개발자가 루프를 제어 → 결과 검증, 재시도, 조건부 분기 가능
```

| 패턴 | 플러그인 | SDK |
|------|---------|-----|
| 결과 검증 후 재시도 | ❌ | ✅ |
| 조건부 브랜칭 | ❌ | ✅ |
| A/B 테스트 (두 모델 비교) | ❌ | ✅ |
| 체이닝 (결과를 다음 입력으로) | ❌ | ✅ |

### 사전 질문

- "코드 리뷰 결과의 품질"을 어떻게 자동으로 평가할 수 있을까?
- 평가 루프를 무한히 돌리면 어떤 문제가 생길까?

> ⛔ **STOP** — 위 질문에 대한 생각을 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 피드백 포인트

- 품질 평가: 키워드 존재 확인 (코드 예시, 심각도, 개선 제안), 길이 검증, 구조 검증 (마크다운 제목), 또는 다른 에이전트를 평가자로 사용
- 무한 루프: 비용 폭증 + 개선이 안 되면 같은 결과 반복. `maxAttempts`로 제한 필수

### 퀴즈

**Q1**: 평가 루프에서 세션(resume)을 사용하는 이유는?

### 정답 가이드

- Q1: 이전 리뷰 맥락을 유지하면서 "이 부분을 보완해줘"라고 요청할 수 있음. 세션 없이는 매번 처음부터 다시 리뷰

> Block 1에서 통합 시스템을 설계합니다. "Block 1 시작"이라고 말해주세요.
