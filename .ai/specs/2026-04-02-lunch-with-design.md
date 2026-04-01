---
title: 점심 With — 식사 동행 기록 서비스
date: 2026-04-02
status: in-progress
---

# 점심 With — 설계 문서

## 개요

bizfest 법인카드 사용 시 매일 등록해야 하는 "누구와 함께 식사했는지"를 간편하게 기록하는 모바일 웹앱.

## 기술 스택

- **Next.js 15** (Pages Router) — cc-monitor 패턴 참고
- **Prisma + Turso** (LibSQL) — 클라우드 SQLite
- **Tailwind CSS** — 화이트 테마, 모바일 퍼스트
- **Vercel** 배포
- **localStorage** — 사용자 식별

## 데이터 모델

```prisma
model User {
  id        String   @id @default(cuid())
  name      String   @unique
  team      String   // "product" | "data"
  records   Record[]
}

model Record {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  date       String   // "2026-04-02"
  mealType   String   // "lunch" | "dinner" | "other"
  companions String   // JSON array: ["cuid1", "cuid2"]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

- `companions`: JSON string으로 동행자 ID 저장. 14명 규모에서 관계 테이블은 오버엔지니어링.
- `date`: String. SQLite에서 문자열 비교가 직관적.
- User 테이블에 시드 데이터 14명.

## 시드 데이터

### 제품팀
김수민, 김승규, 박지윤, 손혜정, 신상호, 신지선, 우지원, 유명선, 이영현, 이태림

### 데이터팀
김수정, 정민주, 조범규, 최기호

## API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/records` | GET | 월별 기록 조회 (`?userId=&month=2026-04`) |
| `/api/records` | POST | 기록 생성 |
| `/api/records/[id]` | PUT | 기록 수정 |
| `/api/records/[id]` | DELETE | 기록 삭제 |
| `/api/users` | GET | 팀원 목록 |

## 화면 구성

### 1. 최초 진입 (온보딩)
- 팀원 리스트에서 본인 이름 탭
- "김승규님으로 시작할게요" [확인] 버튼
- localStorage에 userId 저장
- 이후 접속 시 바로 등록 탭

### 2. 등록 탭 (메인)
- 오늘 날짜 표시
- 식사구분 선택: 점심 / 석식 / 기타
  - 기본값: 오후 5시 이전 → 점심, 이후 → 석식
- 팀별 배지 UI로 동행자 선택 (다중 선택)
  - 제품팀 / 데이터팀 그룹 구분
  - 선택 시 배지 색상 변경 (파란색)
- [저장] 버튼

### 3. 히스토리 탭
- 월 네비게이션 (`‹ 2026년 4월 ›`)
- 컴팩트 카드 리스트
  - 1줄: 날짜 + 요일 + 식사구분 뱃지
  - 2줄: 복사아이콘(이름 왼쪽) + 동행자 이름들
  - 오른쪽: `›` (카드 세로 중앙, 수정/삭제 상세 진입)
- 복사 아이콘 탭 → 동행자 이름 클립보드 복사
- 카드 or `›` 탭 → 수정/삭제 화면

### 4. 수정/삭제 화면
- 등록 탭과 동일한 폼에 기존 데이터 채워진 상태
- [수정] + [삭제] 버튼

### 하단 탭바
- 📝 등록 | 📋 히스토리
- 페이지 전환 방식 (등록에 집중 / 조회에 집중)

## 디자인 원칙

- **화이트 테마** — 깔끔한 라이트 모드
- **모바일 퍼스트** — 375px 기준 설계
- **심플 is Best** — 최소한의 UI로 핵심 기능만
- 액센트 컬러: #2563eb (파란색)
- 석식 뱃지: #f59e0b (주황색)

## 인증

- 인증 없음
- 최초 1회 이름 선택 → localStorage 저장
- 변경은 설정에서만 가능 (실수 방지)

## 서비스 위치

`services/lunch-with/` — pnpm workspace 멤버
