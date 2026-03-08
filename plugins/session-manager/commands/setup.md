---
description: .ai/ 폴더 구조 + INDEX.md 초기 생성
allowed-tools: Read, Write, Glob, Bash, AskUserQuestion
---

프로젝트의 `.ai/` 폴더 구조를 초기화하고, 프로젝트를 분석하여 INDEX.md를 자동 생성한다.

## 동작

### 1. 기존 INDEX.md 확인

- `.ai/INDEX.md` 존재 → AskUserQuestion: "이미 INDEX.md가 존재합니다. 다시 생성할까요?"
  - "아니오" → 종료
  - "예" → 기존 파일 덮어쓰기로 진행

### 2. 프로젝트 정보 수집

아래 정보를 Read, Glob으로 수집:

- `CLAUDE.md` (프로젝트 루트) — 프로젝트 성격, 구조
- `package.json` (있으면) — 이름, 기술스택, 의존성
- `tsconfig.json` (있으면) — TS 설정
- 최상위 디렉토리 구조 (Bash `ls -1`)
- `.ai/active/*.md` — 기존 진행 중 작업
- `.ai/patterns/*.md` — 기존 패턴 목록
- `.ai/notes/*.md` — 기존 노트 목록

### 3. .ai/ 하위 폴더 생성

없는 폴더만 생성 (기존 파일은 절대 건드리지 않음):

```
.ai/
├── active/
├── archive/
├── notes/
└── patterns/
```

Bash 명령: `mkdir -p .ai/active .ai/archive .ai/notes .ai/patterns`

### 4. INDEX.md 생성

수집한 정보를 기반으로 아래 포맷으로 생성:

```markdown
# {프로젝트명} Context

## 프로젝트 개요
{CLAUDE.md 기반 한 줄 요약}

## 서비스 맵
| 서비스 | 역할 | 기술스택 |
|--------|------|----------|
| ... | ... | ... |

## 현재 진행 중
- [작업명](active/xxx.md) — 설명

## 핵심 결정
- {프로젝트의 주요 기술 결정}

## 패턴
- [패턴명](patterns/xxx.md)

## 노트
- [노트명](notes/xxx.md)
```

### 5. 결과 출력

생성된 내용 요약:

```
.ai/ 초기화 완료:
- 폴더: active/, archive/, notes/, patterns/
- INDEX.md 생성 — {프로젝트명} ({서비스 N개, 진행중 작업 N개})
```

## 원칙

- INDEX.md는 **토큰 효율적**으로 — SessionStart 시 매번 주입되므로 과도한 정보 금지
- CLAUDE.md 내용을 복붙하지 않음 — AI 작업에 필요한 정보만 추출/요약
- 이미 존재하는 `.ai/` 하위 폴더와 파일은 건드리지 않음
- "현재 진행 중" 섹션은 active/ 파일이 있을 때만 포함
- "패턴" / "노트" 섹션은 해당 파일이 있을 때만 포함
- 빈 섹션은 생략
