# Block 1: 통합 설계 — 코드 리뷰 시스템

## Phase A — 설계

### 구축할 시스템

M01~M11의 모든 개념을 조합한 "평가 루프가 있는 코드 리뷰 시스템":

```
사용자 요청
    │
    ▼
 코드 리뷰어 에이전트
 ├── systemPrompt (M03)     ← 역할 정의
 ├── tools (M02)            ← 파일 읽기
 ├── hooks (M05)            ← 감사 로그
 ├── agents (M07)           ← 서브에이전트 위임
 └── resume (M06)           ← 세션 유지
    │
    ▼
 품질 검증 (평가 함수)
 ├── 코드 예시 포함?
 ├── 심각도 등급 포함?
 └── 개선 제안 포함?
    │
 ┌──┴──┐
 │ No  │ Yes
 ▼     ▼
재리뷰  최종 결과
(feedback + resume)
```

### 각 M01~M11 개념의 역할

| Module | 역할 | 코드 |
|:------:|------|------|
| M01 | `query()` 에이전트 루프 | 기본 실행 |
| M02 | `tools: ["Read", "Glob", "Grep"]` | 파일 탐색 |
| M03 | `systemPrompt` | 리뷰어 역할 정의 |
| M04 | `permissionMode` | 안전장치 |
| M05 | `hooks.PostToolUse` | 감사 로그 |
| M06 | `resume: sessionId` | 평가 루프에서 맥락 유지 |
| M07 | `agents: { ... }` | 전문화된 리뷰 위임 |
| M08 | `mcpServers` | (선택) 외부 연동 |
| M09 | Custom tools | (선택) 평가 함수 도구화 |
| M10 | Streaming | 진행 상황 표시 |
| M11 | Error handling | 재시도 + 비용 추적 |

### 평가 함수

```typescript
function evaluateReview(result: string): { pass: boolean; feedback: string } {
  const checks = {
    hasCodeExamples: result.includes("```"),
    hasSeverity: /심각|중요|낮음|높음|critical|high|medium|low/i.test(result),
    hasSuggestions: result.includes("제안") || result.includes("개선") || result.includes("suggest"),
    hasMinLength: result.length > 200,
  };

  const missing = Object.entries(checks)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  if (missing.length === 0) {
    return { pass: true, feedback: "" };
  }
  return {
    pass: false,
    feedback: `누락 항목: ${missing.join(", ")}`,
  };
}
```

### 설계 과제

위 구조를 기반으로 `src/m12-integration/integration.ts`의 전체 구조를 설계해보자:
1. 어떤 옵션 조합을 사용할지
2. 평가 루프의 최대 반복 횟수
3. 감사 로그에 어떤 정보를 기록할지

> ⛔ **STOP** — 통합 시스템의 설계를 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> 이 시스템은 플러그인으로는 **절대 구현할 수 없다**.
> - 결과 검증 후 재시도: 프로그래밍 루프 필요
> - 세션 유지 + 피드백: `resume` + 동적 프롬프트
> - 비용 추적 + 감사 로그: 훅 + result 분석
>
> 이것이 "하네스를 직접 구축"하는 것의 의미.

### 퀴즈

**Q1**: 평가 함수를 에이전트로 대체할 수 있는가? (에이전트가 다른 에이전트의 결과를 평가)

### 정답 가이드

- Q1: 가능하다. 이것이 "Eval-Driven Development" 패턴. 평가 에이전트를 서브에이전트로 정의하고, 결과를 pass/fail로 판단하게 할 수 있음. 단, 비용이 2배

> Block 2에서 실제로 구현합니다. "Block 2 시작"이라고 말해주세요.
