---
description: cc-monitor Harness 데이터를 가져와 하네스 품질을 분석하고 개선 포인트를 제시한다
---

# Harness Report

cc-monitor의 Harness 데이터를 분석하여 하네스 고도화 방향을 제시한다.

## 실행 단계

### 1. 데이터 수집
WebFetch로 cc-monitor API에서 harness 데이터를 가져온다:

- `https://cc-monitor.vercel.app/api/harness?days=30` — 스킬 사용, 컨벤션 주입, Config 변화
- `https://cc-monitor.vercel.app/api/adoption?period=day&days=30` — Adoption 추세

두 요청을 병렬로 실행한다.

### 2. 데이터 분석

가져온 데이터를 아래 관점으로 분석한다:

#### 스킬 사용 (skills)
- 가장 많이 쓰인 스킬 Top 5와 사용 패턴
- 전혀 안 쓰이는 스킬이 있다면 → 왜 안 쓰이는지, 개선/제거 제안
- 일별 추이에서 급변 감지

#### 컨벤션 주입 (conventions)
- 가장 많이 주입되는 컨벤션 → 해당 영역 작업량이 많거나, 스킬로 내재화할 여지
- 바이트 대비 주입 횟수 비율 → 컨텍스트 비용 효율
- 특정 키워드가 과도하게 트리거하는 컨벤션 → 매칭 정밀도 개선 필요

#### Config 변화 (config)
- rules/hooks/mcp/CLAUDE.md 증감 추이 → 하네스가 성장하고 있는가?
- 최근 변경 사항 중 주목할 점

#### Adoption 추세 (adoption)
- 세션 수, 턴 수 추이 → 사용량 변화
- 세션당 평균 턴 수 변화 → 효율성 지표

### 3. 리포트 출력

아래 형식으로 결과를 출력한다:

```
## Harness Report (최근 30일)

### 요약
- [핵심 인사이트 1~3개, 각각 한 줄]

### 스킬 사용
- [분석 결과]

### 컨벤션 주입
- [분석 결과]

### Config 변화
- [분석 결과]

### Adoption
- [분석 결과]

### 개선 제안
1. [구체적 액션 + 근거]
2. [구체적 액션 + 근거]
3. [구체적 액션 + 근거]
```

개선 제안은 **구체적 액션**이어야 한다. "개선이 필요합니다" 같은 추상적 제안 금지. "api-layer.md 컨벤션을 스킬로 내재화하면 주입당 2KB 컨텍스트 절약" 수준으로 구체적으로.
