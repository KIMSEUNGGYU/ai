---
name: daily-brief
description: "매일 아침 자동 브리핑 또는 수동 브리핑 요약. 날씨 + Linear 할 일 + 캘린더(선택)를 한번에 보여줌. 사용자가 '브리핑', '오늘 뭐 해?', '모닝 브리프', '하루 요약', 'daily brief'를 말하면 트리거. cron으로 매일 자동 실행 가능. LINEAR_API_KEY 환경변수 필요."
user-invocable: true
metadata:
  openclaw:
    emoji: "☀️"
    requires:
      bins: ["curl"]
    primaryEnv: "LINEAR_API_KEY"
---

# 데일리 브리핑

날씨 + 할 일 + 일정을 한번에 요약하는 모닝 브리프.

## 실행 규칙

1. 항상 **한국어**로 응답
2. 각 섹션은 이모지로 구분
3. 정보 수집이 하나 실패해도 나머지는 계속 보여주기
4. 간결하게 — 전체 응답이 10줄 이내

## 실행 순서

### Step 1: 날씨 조회

```bash
curl -s "wttr.in/Seoul?format=%c+%t+(체감+%f),+바람+%w&lang=ko"
```

도시는 USER.md에 위치 정보가 있으면 그것을 사용, 없으면 Seoul.

### Step 2: Linear 이슈 조회

진행중 + 백로그 이슈 상위 5개:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ viewer { assignedIssues(filter: { state: { type: { nin: [\"completed\", \"canceled\"] } } }, orderBy: priority, first: 5) { nodes { identifier title state { name type } priorityLabel } } } }"}'
```

### Step 3: 응답 조합

## 응답 형식

```
☀️ 오늘 브리핑 (3월 7일 금요일)

🌤️ 날씨: 서울 ☁️ 8°C (체감 5°C), 바람 약함

📋 오늘 할 일:
  🟡 ISH-123 주문 서류 리팩토링 [P1]
  🟡 ISH-124 배송 API 연동 [P2]
  ⚪ ISH-125 차트 개선 [P3]

좋은 하루 되세요! 🦞
```

## cron 자동 실행 설정

매일 아침 8시에 자동 실행하려면 cron 도구로:

```
cron 도구 사용: 매일 08:00 KST에 "daily-brief" 실행
```

사용자가 "매일 아침 브리핑 설정해줘"라고 하면:
1. cron 도구로 매일 08:00 작업 등록
2. 실행 내용: 이 스킬의 Step 1~3 수행
3. 결과를 현재 세션(Telegram 등)으로 전송

## 확장 가능

- Google Calendar 연동 시 일정 섹션 추가 가능
- GitHub PR 리뷰 대기 목록 추가 가능
- 각 섹션을 별도 스킬로 분리하고 이 스킬에서 오케스트레이션 가능
