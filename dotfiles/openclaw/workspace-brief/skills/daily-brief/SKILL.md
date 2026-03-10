---
name: daily-brief
description: "매일 아침 자동 브리핑 또는 수동 브리핑 요약. 날씨 + Linear 할 일 + GitHub PR 리뷰를 한번에 보여줌. 사용자가 '브리핑', '오늘 뭐 해?', '모닝 브리프', '하루 요약', 'daily brief'를 말하면 트리거. cron으로 매일 자동 실행 가능. LINEAR_API_KEY 환경변수 필요."
user-invocable: true
metadata:
  openclaw:
    emoji: "☀️"
    requires:
      bins: ["curl", "gh"]
    primaryEnv: "LINEAR_API_KEY"
---

# 데일리 브리핑

날씨 + Linear 할 일 + GitHub PR 리뷰를 한번에 요약하는 모닝 브리프.

## 실행 규칙

1. 항상 **한국어**로 응답
2. 아래 응답 형식을 **정확히** 따를 것 (자유 해석 금지)
3. 정보 수집이 하나 실패해도 나머지는 계속 보여주기
4. 간결하게 — 각 섹션 핵심만

## 실행 순서

### Step 1: 날씨 조회

```bash
curl -s "wttr.in/Seoul?format=%c+%t+(체감+%f),+바람+%w&lang=ko"
```

도시는 USER.md에 위치 정보가 있으면 그것을 사용, 없으면 Seoul.

### Step 2: Linear 이슈 조회

진행중 + 미완료 이슈 상위 5개 (우선순위순):

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ viewer { assignedIssues(filter: { state: { type: { nin: [\"completed\", \"canceled\"] } } }, first: 5) { nodes { identifier title state { name type } priorityLabel } } } }"}'
```

### Step 3: GitHub PR 리뷰 대기 조회

내게 리뷰 요청된 PR 목록 (회사 레포):

```bash
gh pr list --repo ishopcare/ishopcare-frontend --state open --search "review-requested:@me" --json number,title,author --limit 5
```

리뷰 요청이 없으면 "없음"으로 표시.

### Step 4: 응답 조합

## 응답 형식 (반드시 이 형식을 따를 것)

```
☀️ 브리핑 ({M월 D일 요일})

🌤️ {날씨 아이콘} {기온} (체감 {체감기온}), 바람 {바람}

📋 할 일 ({N}개):
{상태이모지} {이슈ID} {제목} [{우선순위}]
{상태이모지} {이슈ID} {제목} [{우선순위}]
...

🔍 PR 리뷰 ({N}개):
#{번호} {제목} — {작성자}
...
(없으면 "리뷰 요청 없음")
```

상태 이모지: 🔴 긴급 / 🟡 진행중 / ⚪ 백로그

## cron 자동 실행

매일 아침 자동 실행 시 cron 도구 사용.

## 확장 가능

- Google Calendar 연동 시 일정 섹션 추가 가능 (gog CLI 필요)
- 각 섹션을 별도 스킬로 분리하고 이 스킬에서 오케스트레이션 가능
