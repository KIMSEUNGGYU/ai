# Block 0: 비용 추적

## Phase A — 개념

### 핵심 개념

프로덕션에서 에이전트를 운영하면 **비용 관리**가 핵심이다.

### result 메시지의 비용 정보

```typescript
{
  type: "result",
  subtype: "success",
  total_cost_usd: 0.0234,     // 총 비용 (달러)
  num_turns: 3,               // 에이전트 루프 턴 수
  duration_ms: 15234,         // 전체 소요 시간
  duration_api_ms: 12100,     // API 호출 시간
}
```

### 비용 최적화 전략

| 전략 | 효과 | 방법 |
|------|------|------|
| 모델 선택 | 비용 90% 절감 | `model: "haiku"` (단순 작업) |
| 도구 제한 | 턴 수 감소 | 필요한 도구만 `tools`에 포함 |
| maxTurns 설정 | 런어웨이 방지 | `maxTurns: 5` |
| System Prompt 최적화 | 출력 토큰 절감 | "3줄 이내로 요약" |

### 비용 추적 코드 패턴

```typescript
interface CostReport {
  totalCost: number;
  totalTurns: number;
  totalDuration: number;
  queryCount: number;
}

const report: CostReport = { totalCost: 0, totalTurns: 0, totalDuration: 0, queryCount: 0 };

// 각 query 실행 후
for await (const msg of query({ ... })) {
  if (msg.type === "result") {
    report.totalCost += msg.total_cost_usd;
    report.totalTurns += msg.num_turns;
    report.totalDuration += msg.duration_ms;
    report.queryCount++;
  }
}

console.log(`총 비용: $${report.totalCost.toFixed(4)}`);
console.log(`평균 비용/쿼리: $${(report.totalCost / report.queryCount).toFixed(4)}`);
```

### 사전 질문

- 하루에 100번 에이전트를 실행하면 월 비용은 얼마일까?
- `maxTurns`를 너무 낮게 설정하면 어떤 문제가 생길까?

> ⛔ **STOP** — 위 질문에 대한 생각을 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 피드백 포인트

- Opus 기준 약 $0.33/call → 100회/일 → $33/일 → 약 $1000/월. Haiku로 바꾸면 $100/월 이하
- maxTurns 너무 낮으면: 복잡한 작업이 미완성 상태로 종료. 에이전트가 "턴 제한에 도달했습니다" 보고

### 퀴즈

**Q1**: SDK 비용은 API 키로 과금되는가, Claude Code 구독으로 과금되는가?

### 정답 가이드

- Q1: Claude Code CLI를 서브프로세스로 실행하므로 기존 구독(Max/Pro)을 사용. 별도 API 비용이 아님. `total_cost_usd`는 추정치

> Block 1에서 에러 핸들링 패턴을 다룹니다. "Block 1 시작"이라고 말해주세요.
