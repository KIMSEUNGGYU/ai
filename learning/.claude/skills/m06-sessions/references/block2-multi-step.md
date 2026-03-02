# Block 2: 멀티스텝 워크플로우

## Phase A — 설계

### 패턴: 세션 기반 멀티스텝 워크플로우

세션을 활용한 실용적 패턴을 설계해보자.

**패턴 1: 분석 → 수정 → 검증**

```typescript
// Step 1: 코드 분석
const result1 = await runQuery("이 파일의 버그를 찾아줘");
sessionId = captureSessionId(result1);

// Step 2: 사용자 확인 후 수정 (같은 맥락에서)
const result2 = await runQuery("첫 번째 버그를 수정해줘", { resume: sessionId });

// Step 3: 수정 결과 검증 (같은 맥락에서)
const result3 = await runQuery("수정이 올바른지 확인해줘", { resume: sessionId });
```

**패턴 2: 세션 포크 (같은 맥락, 다른 방향)**

```typescript
// 공통 분석
const result = await runQuery("이 코드의 구조를 분석해줘");
sessionId = captureSessionId(result);

// 포크 A: 리팩토링 방향
await runQuery("이 코드를 함수형으로 리팩토링해줘", { resume: sessionId });

// 포크 B: 같은 분석 맥락에서 다른 방향
await runQuery("이 코드의 테스트를 작성해줘", { resume: sessionId });
```

### 설계 과제

다음 시나리오의 멀티스텝 워크플로우를 설계해보자:

**"PR 자동 리뷰 봇"**
1. PR의 변경 파일 목록 확인
2. 각 파일의 변경 내용 분석
3. 리뷰 코멘트 생성
4. 전체 요약 작성

이 4단계를 세션으로 어떻게 연결할지 설계해보자.

> ⛔ **STOP** — PR 리뷰 봇의 멀티스텝 설계를 공유해주세요.

---

## Phase B — 피드백 + 종합

### PR 리뷰 봇 설계 예시

```typescript
// Step 1: 변경 파일 목록 확인
for await (const msg of query({
  prompt: "git diff --name-only를 실행해서 변경된 파일 목록을 알려줘",
  options: { tools: ["Bash"], ... }
})) {
  if (msg.type === "system") sessionId = msg.session_id;
  if (msg.type === "result") changedFiles = msg.result;
}

// Step 2: 분석 (같은 맥락에서)
for await (const msg of query({
  prompt: "변경된 파일들을 하나씩 읽고 분석해줘",
  options: { resume: sessionId }
})) { ... }

// Step 3: 리뷰 코멘트 (같은 맥락에서)
for await (const msg of query({
  prompt: "각 파일에 대한 리뷰 코멘트를 작성해줘",
  options: { resume: sessionId }
})) { ... }

// Step 4: 전체 요약
for await (const msg of query({
  prompt: "전체 PR에 대한 요약 리뷰를 작성해줘",
  options: { resume: sessionId }
})) { ... }
```

### M06 종합 퀴즈

**Q1**: 세션을 사용하면 비용이 줄어드는가, 늘어나는가?

**Q2**: 세션 포크에서 A와 B가 서로의 변경을 볼 수 있는가?

### 정답 가이드

- Q1: 도구 재호출이 줄어서 비용 절약 효과가 있지만, 세션 히스토리 자체가 입력 토큰에 포함되므로 대화가 길어지면 비용 증가. 트레이드오프.
- Q2: 볼 수 없다. 포크는 같은 시작점에서 갈라지지만, 각각 독립적인 대화 경로. A의 결과가 B에 영향을 주지 않음.

### 학습 노트

```
notes/m06-sessions.md에 정리:
- session_id 캡처 방법 (system/init 메시지)
- resume 옵션으로 맥락 유지
- 멀티스텝 워크플로우 패턴
- 세션 포크 개념
- 비용 트레이드오프
```

> M06 완료! 다음 **M07: Subagents**에서 작업 위임과 병렬 처리를 다룹니다. `/m07-subagents`를 호출하세요.
