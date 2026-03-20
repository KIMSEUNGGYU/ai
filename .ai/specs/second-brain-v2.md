---
title: 세컨드 브레인 시스템 v2
date: 2026-03-21
status: designing
---

# 세컨드 브레인 시스템 v2

> AI가 "디지털 나"로 동작하기 위한 지식 시스템. 코딩뿐 아니라 사고, 가치관, 관심사 전체를 포함.

## 핵심 구조 — 3레이어

```
rules/  지시    "AI야 이 규칙은 반드시 따라"       CLAUDE.md 자동 로드
.ai/    작업    "지금 이 프로젝트에서 뭘 하고 있는지" SessionStart hook
hq/     지식    "나에 대한 모든 것"                 SessionStart hook + 필요 시 Read
```

### 레이어별 역할

| 레이어 | 담는 것 | 전달 경로 | 특성 |
|--------|---------|-----------|------|
| rules/ | 확실히 작동하는 AI 행동 규칙 (conventions, identity) | CLAUDE.md 자동 로드 | 짧고 확실 |
| .ai/ | 현재 작업 상태 (active, specs, backlog) | SessionStart hook | 프로젝트 루트 |
| hq/ | 나에 대한 전역 지식 + 프로젝트 축적 지식 + 학습 + 일일 기록 | SessionStart hook + Read | 세컨드 브레인 |

### 기존 시스템과의 관계

| 기존 | hq | 차이 |
|------|-----|------|
| rules/identity.md | hq/20_me/ | identity = 짧은 지시, me = 깊은 지식 |
| .ai/active/ | hq/10_projects/ | active = 현재 작업 스냅샷, projects = 장기 축적 |
| learning/ | hq/30_learn/ | learning = 코드/실습, learn = 정리된 노트 |

중복이 아닌 깊이 차이. rules/와 .ai/는 세션용(가볍고 빠름), hq는 장기 축적(깊고 영속).

### 검토 사항

- decisions.md를 rules/ → hq/20_me/로 이동 검토
  - rules/에서 확실히 효과 있는 것(conventions, identity)만 남기고
  - 판단 패턴 같은 "깊은 지식"은 hq에서 관리

---

## hq 폴더 구조

```
hq/
├── 00_daily/        /recap 결과물 (하루 기록)
├── 10_projects/     프로젝트별 축적 지식
│   ├── ishopcare/               공통 (가맹점 타입, VAN, 모두싸인 등)
│   │   ├── context.md
│   │   ├── decisions.md
│   │   ├── policies.md
│   │   ├── log.md
│   │   ├── admin/               청약/출고/루키/가맹점/정산
│   │   │   ├── context.md
│   │   │   ├── decisions.md
│   │   │   ├── policies.md
│   │   │   └── log.md
│   │   └── partners/            문서 제출 퍼널/배송/추적
│   │       ├── context.md
│   │       ├── decisions.md
│   │       ├── policies.md
│   │       └── log.md
│   ├── ishopcare-server/        백엔드
│   │   ├── context.md
│   │   ├── decisions.md
│   │   ├── policies.md
│   │   └── log.md
│   └── ai/                      AI 모노레포
│       ├── context.md
│       ├── decisions.md
│       ├── policies.md
│       └── log.md
├── 20_me/           나에 대한 전역 지식
│   ├── core.md          변하지 않는 나 (가치관, 사고방식, 핵심 원칙)
│   └── now.md           지금의 나 (현재 관심사, 진행 중 고민, 최근 변화)
├── 30_learn/        학습/참고자료
└── 90_archive/      완료/비활성
```

### 프로젝트 4파일 역할

| 파일 | 담는 것 | 업데이트 | SessionStart 주입 |
|------|---------|----------|-------------------|
| context.md | 도메인 + 아키텍처 (변하지 않는 핵심) | 드물게, 수동 | 전문 주입 |
| decisions.md | 기술 결정 + 근거 | /done 자동 추가 | 전문 주입 |
| policies.md | 비즈니스 규칙/정책 | 수동 + /done | 전문 주입 |
| log.md | 시간순 작업 기록 | /done 자동 append | 최신 N개만 |

### SessionStart 프로젝트 매핑

```
~/work/ishopcare-frontend (루트)
  → ishopcare/ 공통 4파일

~/work/ishopcare-frontend/services/admin
  → ishopcare/ 공통 + ishopcare/admin/ 4파일

~/work/ishopcare-frontend/services/partners
  → ishopcare/ 공통 + ishopcare/partners/ 4파일

~/work/ishopcare-retool-server
  → ishopcare-server/ 4파일

~/dev/ai
  → ai/ 4파일
```

- 번호 접두사 유지 (Obsidian 정렬용)
- PARA 용어 제거, 이름이 곧 역할
- 5개 최상위 폴더, 프로젝트별 4파일

---

## 축적 — 지식이 hq에 쌓이는 경로

```
/done (매 작업 완료) — 자동, 안 해도 안 무너짐
  ├→ rules/ 자가학습 (기존 유지)
  └→ hq/10_projects/{name}/에 프로젝트 지식 저장 (NEW)

/recap (하루 끝, 선택적) — 안 해도 시스템은 돌아감
  ├→ hq/00_daily/{date}.md 리캡 저장
  ├→ hq/20_me/ 전역 인사이트 업데이트
  └→ rules/ 업데이트 후보 제안

/note → hq/30_learn/
/study → hq/30_learn/
```

핵심: /recap에 단일 의존하지 않음. /done이 매번 자동 축적.

---

## 활용 — AI가 지식을 받는 방식

```
SessionStart hook
  ├→ hq/20_me/* 전문 주입 (매 세션)
  │   파일 자체를 짧게 유지하는 게 핵심
  │
  ├→ hq/10_projects/{name}/ 최신 N개 항목 직접 주입
  │   cwd 기반 자동 매핑:
  │     ~/work/ishopcare → projects/ishopcare
  │     ~/dev/ai → projects/ai
  │
  ├→ rules/ 자동 로드 (기존, CLAUDE.md)
  └→ .ai/INDEX.md + active (기존)
```

- "필요 시 읽기"는 AI가 잘 못함 → 사용하지 않음
- 목차 주입도 노이즈만 됨 → 사용하지 않음
- 최신 N개를 직접 주입하고, me/는 전문 주입

---

## 리서치에서 참고한 것

- MemSpren: hot memory (~800 토큰) 개념 → me/를 짧게 유지
- Basic Memory: 지시(CLAUDE.md) vs 지식(별도 저장소) 분리 → rules/ vs hq/ 분리
- COG Second Brain: Obsidian + Claude Code 17개 Skill
- Kenneth Reitz: "잘 쓴 CLAUDE.md 하나가 세컨드 브레인을 생각하는 뇌로 바꾼다"

---

## 확정된 설계

- [x] 3레이어: rules/(지시) + .ai/(작업) + hq/(지식)
- [x] hq 5개 최상위 폴더: daily, projects, me, learn, archive
- [x] 20_me/: core.md + now.md (시간축 분리)
- [x] 10_projects/ 구조: 프로젝트별 4파일 (context, decisions, policies, log)
- [x] ishopcare 하위에 admin/, partners/ 서비스별 폴더
- [x] 축적: /done 유지 + hq 확장, /recap은 보너스
- [x] 활용: me/ 전문 주입, projects/ context+decisions+policies 전문 + log 최신 N개

## 미정 (추가 논의 필요)

- [ ] 축적 구현 — /done이 프로젝트 4파일에 어떻게 저장하는지 구체화
- [ ] 활용 구현 — SessionStart hook 수정, 프로젝트 매핑 테이블
- [ ] 마이그레이션 — 현재 hq → 새 구조로 전환
- [ ] decisions.md(rules/) 이동 여부 최종 결정
- [ ] /done 자가학습 퀄리티 개선 방안
