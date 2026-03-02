# Block 2: 멀티 서브에이전트 — 역할 분담

## Phase A — 실험

### 패턴: 역할별 서브에이전트

여러 서브에이전트를 정의하고, 메인 에이전트가 상황에 맞게 선택하도록 한다.

`src/m07-subagents/subagents.ts`의 `agents`를 다음으로 확장:

```typescript
agents: {
  "code-reviewer": {
    description: "코드 품질, 에러 핸들링, 타입 안전성을 리뷰합니다.",
    prompt: `TypeScript 코드 리뷰어. 품질, 에러 핸들링, 타입 안전성을 분석하고 3줄 요약.`,
    tools: ["Read", "Glob", "Grep"],
  },
  "doc-writer": {
    description: "코드를 읽고 JSDoc 문서를 생성합니다.",
    prompt: `문서 작성자. 코드를 읽고 JSDoc 스타일의 문서를 작성. 각 함수/클래스에 설명 추가.`,
    tools: ["Read", "Glob"],
  },
  "security-checker": {
    description: "보안 취약점을 분석합니다. OWASP Top 10 기준.",
    prompt: `보안 감사자. OWASP Top 10 기준으로 잠재 취약점을 분석. 심각도 등급 표시.`,
    tools: ["Read", "Glob", "Grep"],
  },
}
```

프롬프트:
```typescript
prompt: `src/m01-hello/hello.ts 파일에 대해:
1. code-reviewer로 코드 리뷰
2. security-checker로 보안 분석
결과를 종합해서 알려줘.`
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m07-subagents/subagents.ts
```

### 관찰 포인트

1. 메인 에이전트가 두 서브에이전트를 **순차적**으로 호출하는가, **병렬**로 호출하는가?
2. 각 서브에이전트의 결과를 메인이 어떻게 종합하는가?
3. `doc-writer`는 호출되지 않는가? (프롬프트에 요청하지 않았으므로)

> ⛔ **STOP** — 멀티 서브에이전트 실행 결과를 공유해주세요.

---

## Phase B — 피드백 + 종합

### 핵심 인사이트

> 메인 에이전트는 **오케스트레이터** 역할을 한다.
> - 어떤 서브에이전트를 호출할지 판단 (description 기반)
> - 결과를 받아서 종합
> - 필요 없는 서브에이전트는 호출하지 않음
>
> 이것이 "Skills as Agents" 패턴의 핵심. 플러그인의 agents/*.md와 동일한 구조.

### M07 종합 퀴즈

**Q1**: 서브에이전트에 `model: "haiku"`를 설정하면 어떤 효과가 있는가?

**Q2**: 서브에이전트가 메인 에이전트의 세션(맥락)을 공유하는가?

**Q3**: 서브에이전트 내부에서 또 다른 서브에이전트를 정의할 수 있는가?

### 정답 가이드

- Q1: 해당 서브에이전트만 Haiku 모델로 실행. 비용 절약에 효과적 (단순 작업에 Haiku, 복잡한 작업에 Opus)
- Q2: 공유하지 않는다. 서브에이전트는 독립된 컨텍스트. 이것이 장점이자 한계
- Q3: SDK에서는 중첩 agents를 정의할 수 있지만, 복잡도가 크게 증가하므로 1단계 위임이 권장

### 학습 노트

```
notes/m07-subagents.md에 정리:
- agents 옵션 구조 (description, prompt, tools)
- 메인 에이전트의 오케스트레이터 역할
- description 기반 자동 선택
- 컨텍스트 분리의 장단점
- 비용 최적화 (model별 분리)
```

> M07 완료! 다음 **M08: MCP**에서 외부 시스템 연동을 다룹니다. `/m08-mcp`를 호출하세요.
