---
name: linear-issues
description: "Linear 이슈 조회 및 관리. 사용자가 할 일, 이슈, 작업, 티켓을 물어볼 때 사용. 예: '오늘 할 일 뭐야?', '내 이슈 보여줘', '이번주 작업', 'Linear 이슈 상태', '진행중인 작업'. LINEAR_API_KEY 환경변수 필요."
metadata:
  openclaw:
    emoji: "📋"
    requires:
      bins: ["curl"]
    primaryEnv: "LINEAR_API_KEY"
---

# Linear 이슈 조회

Linear GraphQL API로 이슈를 조회하고 한국어로 요약한다.

## 환경변수

- `LINEAR_API_KEY` — Linear API 키 (필수)

## 실행 규칙

1. 결과는 **한국어**로 요약
2. 이슈가 많으면 **우선순위 순**으로 상위 10개만
3. 상태별 이모지: 🔴 긴급 / 🟡 진행중 / 🟢 완료 / ⚪ 백로그

## 내 이슈 조회

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ viewer { assignedIssues(filter: { state: { type: { nin: [\"completed\", \"canceled\"] } } }, orderBy: updatedAt, first: 10) { nodes { identifier title state { name type } priority priorityLabel dueDate labels { nodes { name } } } } } }"}'
```

## 특정 상태 이슈 조회

진행중(started) 이슈만:
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ viewer { assignedIssues(filter: { state: { type: { eq: \"started\" } } }, first: 10) { nodes { identifier title state { name } priority priorityLabel } } } }"}'
```

## 이슈 상세 조회

식별자(예: ISH-123)로 조회:
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issue(id: \"ISSUE_UUID\") { identifier title description state { name } priority priorityLabel assignee { name } dueDate labels { nodes { name } } comments { nodes { body createdAt user { name } } } } }"}'
```

식별자로 UUID를 먼저 찾아야 하는 경우:
```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issueSearch(query: \"ISH-123\", first: 1) { nodes { id identifier title description state { name } } } }"}'
```

## 응답 형식

간결하게 목록으로:

```
📋 오늘의 이슈 (3개 진행중)

🟡 ISH-123 주문 서류 상세 페이지 리팩토링 [P1]
🟡 ISH-124 배송 조회 API 연동 [P2]
⚪ ISH-125 대시보드 차트 개선 [P3]
```

상세 조회 시:
```
📋 ISH-123 — 주문 서류 상세 페이지 리팩토링
상태: 진행중 | 우선순위: P1 | 마감: 2026-03-10
라벨: frontend, refactor
---
(설명 요약)
```

## 주의사항

- Linear API는 GraphQL만 지원 (REST 없음)
- 인증: Bearer 토큰이 아니라 API 키를 직접 Authorization 헤더에 전달
- 조회 전용 — 이슈 생성/수정은 별도 스킬로 분리 예정
