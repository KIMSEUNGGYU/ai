# .ai/ Context System 운영 규칙

프로젝트의 `.ai/` 폴더는 AI가 맥락을 유지하기 위한 핵심 인프라다.

## 폴더 구조

```
.ai/
├── INDEX.md          ← AI 진입점 (SessionStart 시 주입)
├── CHANGELOG.md      ← 전체 작업 이력 (타임라인)
├── active/           ← 진행 중 작업 (병렬 가능, 파일당 1작업)
├── specs/            ← 설계 + 구현 계획 문서
├── backlog/          ← 대기 중 작업 + 아이디어
├── notes/            ← 프로젝트 지식 (설계, 분석, 결정)
└── patterns/         ← 재사용 코드 패턴 (핵심 자산)
```

## 핵심 원칙

- `.ai/`는 프로젝트 **루트에 단일** 관리 (하위 서비스에서 실행해도 같은 문맥)
- `active/`는 파일당 1작업 — 병렬 작업 시 파일 분리로 오염 방지
- `specs/`는 설계 및 구현 계획 문서 보관 (superpowers 계획 문서 포함)
- `backlog/`는 대기 중 작업 + 아이디어 보관
- `CHANGELOG.md`는 전체 작업 이력 (완료/진행 타임라인)

## 워크플로우

```
[세션 시작] SessionStart Hook → INDEX.md 주입 → active/ 목록 표시
[작업 선택] 사용자가 active 파일 선택 → 해당 파일 읽기
[작업 중]   코딩
[컨텍스트 80%] /save → active/{task}.md 업데이트 → /clear → 재시작
[작업 완료] /done → archive 저장 + 패턴 질문 + active 삭제
```

## 작업 파일 포맷 (active/backlog 공통)

```markdown
---
title: 작업 제목
status: active | backlog | done
created: YYYY-MM-DD
last-active: YYYY-MM-DD
tags: [카테고리, 기술, ...]
---

# {작업 제목}

## 스펙
- 기획서 요약 or 링크
- 주요 기능

## 작업
- [x] 완료된 항목
- [ ] 진행할 항목     ← 다음 작업

## 현재 컨텍스트
/save 시 업데이트되는 영역

## 결정사항
- 이 작업에서 내린 기술 결정 + 근거

## 컨벤션 변경
- 이 작업에서 변경/추가된 프로젝트 규칙 (없으면 섹션 생략 가능)

## 스펙 변경
- 구현 중 스펙과 달라진 부분 + 사유 (없으면 섹션 생략 가능)

## 세션 이력
- session_id (YYYY-MM-DD HH:mm) — 한 줄 요약
```

**frontmatter 규칙:**
- `status`: 폴더와 동기화 (active/ → active, backlog/ → backlog)
- `last-active`: /save 또는 /done 시 자동 업데이트
- `tags`: 자유 태깅 (검색/필터용)

## patterns 파일 포맷

상세 포맷은 `/note` 커맨드가 생성 시 결정. 기본 구조:

```markdown
# {패턴명}

## 언제 사용
- 이 패턴을 적용하는 상황

## 패턴
파일/폴더 구조 + 핵심 코드

## 예시
- 참고 구현: {실제 경로}
```

## Git 관리

```gitignore
# 추적 (팀 공유)
.ai/INDEX.md
.ai/patterns/

# 제외 (개인 상태)
.ai/active/
```

## 금지사항

- active 파일에 코드 복붙 금지 (경로만 기록)
- INDEX.md에 과도한 정보 금지 (토큰 예산 고려)
- active 파일 삭제는 `/done` 커맨드로만 수행
