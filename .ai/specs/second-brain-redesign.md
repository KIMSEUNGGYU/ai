---
title: 세컨드 브레인 시스템 재설계
date: 2026-03-15
status: in-progress
---

# 세컨드 브레인 시스템 재설계

> AI가 나처럼 판단하는 세컨드 브레인. 규칙 엔진이 아닌 판단 복제 시스템.

---

## A. 컨텍스트 아키텍처

### rules/ 구조 (5개 파일)

```
rules/
├── identity.md      # 나는 누구, 핵심 가치관, 충돌 시 우선순위 (반자동)
├── decisions.md     # 상황→판단→이유 패턴 (자동)
├── conventions.md   # 항상 적용되는 코드/도구 규칙 (자동)
├── system.md        # AI 행동 규칙, git 워크플로우, 자가학습 메타 (자동)
└── pc-map.md        # 폴더 지도 — 참조 테이블 (수동)
```

### 파일별 역할

| 파일 | 성격 | 분류 기준 |
|------|------|-----------|
| identity.md | 나는 이런 사람 | 가치관, 일하는 방식, 충돌 시 우선순위 |
| decisions.md | 상황에 따라 달라지는 판단 | 맥락 의존적 판단 패턴 |
| conventions.md | 항상 적용되는 규칙 | 맥락 무관한 코드/도구 규칙 |
| system.md | 시스템 운영 방법 | AI 행동, git, 자가학습 메타 |
| pc-map.md | 폴더 위치 참조표 | 경로 규칙 |

### 형식: 자연어 통일

모든 파일 동일 형식. 구조화된 WHEN/DO/WHY 대신 자연어:

```markdown
## 제목 (검색/관리용)
판단 내용 + 이유 2~3줄. (근거: 티켓/날짜)
```

예시:
```markdown
## 리팩토링 범위
리팩토링이 3파일 이상 번지면 PR에서 분리한다.
리뷰 부담이 머지 지연으로 이어지기 때문. (ISH-1328)

## API 타입 불일치
FE에서 타입 변환하지 말고 서버 코드 직접 확인 후 DTO 수정.
FE 추론 기반 타입은 런타임 에러의 원인. (ISH-1267)
```

### identity.md 충돌 해소 우선순위

사용자와 상의 후 결정. 예시 구조:
```markdown
## 충돌 시 우선순위
1. ???
2. ???
3. ???
```

### 마이그레이션 매핑

```
기존 파일              → 새 파일
─────────────────────────────────
profile.md 핵심 가치관  → identity.md
profile.md 근거 패턴    → decisions.md
learnings-thinking.md  → decisions.md
learnings-code.md      → conventions.md
learnings-workflow.md  → system.md + decisions.md (내용에 따라)
learnings-meta.md      → system.md
learnings-domain.md    → 삭제 (비어있음)
git-workflow.md        → system.md에 흡수
pc-map.md              → 유지
```

### 삭제/통합 대상

- `learnings-*.md` 5개 → decisions.md + conventions.md + system.md로 흡수
- `profile.md` → identity.md + decisions.md로 분리 흡수
- `session-wrap` 플러그인 → 삭제
- `.ai/notes/` → `.ai/patterns/`에 흡수

### 유지 (변경 없음)

- `~/.claude/projects/*/memory/` — Claude 자동 관리
- OpenClaw workspace — OpenClaw 관리
- `.ai/active/` — 작업 컨텍스트
- CLAUDE.md — 최소한만 유지, 상세는 rules/로

---

## B. 자가학습 (/done) 프로세스

### Phase 구조

```
Phase 1: 작업 완료 처리
  - active 파일 정리
  - CHANGELOG 기록

Phase 2: 판단 패턴 추출
  - 트리거 A: 명시적 거부 → decisions.md
  - 트리거 B: 이유 설명 → decisions.md / system.md
  - 트리거 C: 선택지 결정 → decisions.md
  - 트리거 D: 반복 교정 → conventions.md
  - 추출할 것 없으면 → 스킵

Phase 3: 암묵적 선호 포착
  - 세션에서 일관된 행동 패턴 관찰
  - 질문 형태로 사용자에게 확인
  - "ㅇㅇ" → 저장, "아니" → 버림, 무시 → 다음에 한 번 더 (최대 2회)

Phase 4: 자동 저장 + 기존 패턴 정리
  - 트리거 A~D → 자동 저장
  - 기존 패턴과 모순 시 → 사용자 확인
  - 오래된/안 쓰이는 패턴 → 정리 제안

Phase 5: identity 변화 감지 (반자동)
  - AI가 가치관 변화 감지 시 제안
  - 사용자 승인 시만 반영
```

### 감독 방식

- **자동 저장** (매번 확인 안 함)
- **주기적 감독** (주 1회 또는 사용자가 원할 때)
  - 쌓인 패턴 전체 검토
  - 불필요한 것 삭제
  - 모순/중복 정리

### 분류 기준

```
decisions.md  → "상황에 따라 달라지는 판단" (맥락 의존적)
conventions.md → "항상 적용되는 규칙" (맥락 무관)
system.md     → "시스템/도구 운영 방법"
```

### 제한 없음

- 개수 상한 없음
- 줄 수 상한 없음
- AI가 정리 제안으로 관리

---

## C. 플러그인 정리

### 삭제

- `session-wrap` — orphaned, /done과 완전 중복

### 역할 경계 (변경 없음, 명확화만)

| 플러그인 | 역할 | 트리거 |
|---------|------|--------|
| superpowers | 범용 사고 프레임워크 (brainstorm, TDD, debugging, plans) | 설계/디버깅 시 |
| fe-workflow | FE 전용 (conventions 기반 설계/리뷰/구현) | FE 코드 작업 시 |
| session-manager | 세션 관리 (/save, /resume, /done) | 세션 라이프사이클 |
| dev-workflow | Git 자동화 (/dev:auto, /dev:pr) | PR/커밋 시 |

---

## 구현 순서

### 완료 (2026-03-15)
1. ✅ rules/ 5개 파일 생성 + 기존 내용 마이그레이션
2. ✅ 기존 learnings/profile 파일 삭제
3. ✅ CLAUDE.md 정리 (최소한만 유지)
4. ✅ /done 자가학습 로직 수정 (session-manager v0.16.0)
5. ✅ session-wrap 삭제
6. ✅ identity.md 충돌 해소 우선순위 확정

### 다음 작업 (실전 검증 후)
7. ⬜ 실전 검증 — 회사 작업에서 /done 2~3회 실행, 트리거 A~D 포착 품질 확인
8. ⬜ /review-rules 커맨드 — 주기적 감독용. decisions/conventions 전체 읽고 중복/모순/오래된 패턴 정리 제안
9. ⬜ 피드백 루프 — AI가 decisions.md 패턴을 실제 판단에 활용했는지 트래킹 ("이 판단은 XX 패턴 참고")
