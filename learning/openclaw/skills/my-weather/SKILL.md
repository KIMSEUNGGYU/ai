---
name: my-weather
description: "한국어 날씨 조회 스킬. 사용자가 날씨, 기온, 비/눈 여부를 물어볼 때 사용. 예: '오늘 날씨 어때?', '서울 기온', '내일 비 와?', '이번주 날씨'. API 키 불필요."
metadata:
  openclaw:
    emoji: "🌤️"
    requires:
      bins: ["curl"]
---

# 날씨 조회

한국어로 날씨 정보를 조회하고 응답한다.

## 실행 규칙

1. 사용자가 도시를 명시하지 않으면 **서울**을 기본으로 사용
2. 결과는 항상 **한국어**로 요약해서 전달
3. 불필요한 기술 정보(JSON 원본 등)는 보여주지 않기

## 명령어

### 현재 날씨 (기본)

```bash
curl -s "wttr.in/{도시}?format=%l:+%c+%t+(체감+%f),+바람+%w,+습도+%h&lang=ko"
```

### 비/눈 여부

```bash
curl -s "wttr.in/{도시}?format=%c+%p&lang=ko"
```

### 3일 예보

```bash
curl -s "wttr.in/{도시}?lang=ko"
```

### 주간 예보

```bash
curl -s "wttr.in/{도시}?format=v2&lang=ko"
```

## 응답 형식

간결하게 핵심만:

- "서울 현재 ☀️ 12°C (체감 10°C), 바람 약함, 습도 45%"
- "내일 오후 비 예보 있어요. 우산 챙기세요!"
- 주간 예보는 요일별 한 줄씩

## 참고

- wttr.in 사용 (무료, API 키 불필요)
- `lang=ko` 파라미터로 한국어 지원
- 도시명은 영문으로 변환해서 요청 (서울 → Seoul)
