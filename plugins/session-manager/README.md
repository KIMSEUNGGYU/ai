# session-manager

AI 페어 프로그래밍 context 관리 플러그인. 세션 간 맥락을 `.ai/active/` 파일로 유지하고, 세션 지식을 영속 저장소에 보존한다.

## 커맨드

| 커맨드 | 역할 |
|--------|------|
| `/save` | 작업 컨텍스트를 `.ai/active/{task}.md`에 저장 |
| `/resume` | `.ai/active/` 에서 작업 선택 후 로드 (hook 미작동 시) |
| `/note` | 세션 지식을 영속 저장소에 저장 (AI 자동 판단) |
| `/done` | 작업 완료 처리 — archive 저장 + 패턴 질문 + active 삭제 |

## 스킬

| 스킬 | 트리거 |
|------|--------|
| `note` | "정리해줘", "남겨둬", "노트로 만들어줘" 등 자연어 |

## Convention

| 파일 | 역할 |
|------|------|
| `context-system.md` | `.ai/` 폴더 운영 규칙 (폴더 구조, 워크플로우, 파일 포맷) |

## Hook

| 이벤트 | 동작 |
|--------|------|
| SessionStart | `.ai/INDEX.md` + `active/` 목록을 context에 주입 |
| SessionEnd | `active/*.md` 파일의 last-active 타임스탬프 갱신 |

## 저장 체계

```
세션 대화 (휘발)
    ↓ /save (수동)
.ai/active/{task}.md (작업 context, 병렬 가능)
    ↓ /done (작업 완료 시)
.ai/archive/{서비스}/ (경량 기록)
    ↓ /note (수동 트리거)
영속 저장소:
  ├── .ai/notes/       ← 프로젝트 지식 (설계, 분석, 결정)
  ├── .ai/patterns/    ← 재사용 패턴 (AI 제안 + 사용자 승인)
  └── ~/obsidian-note/ ← 개인 학습 (TIL, 개념, 트러블슈팅)
```

## 워크플로우

```
세션 시작       →  (자동 hook)  →  INDEX.md + active 목록 주입
     ↓
작업 선택       →  /resume      →  active 파일 선택 후 로드
     ↓
세션 진행       →  /note        →  지식을 영속 저장소에 저장
     ↓
세션 종료       →  /save        →  active/{task}.md 업데이트
                   (자동 hook)  →  타임스탬프 갱신
     ↓
작업 완료       →  /done        →  archive + 패턴 질문 + active 삭제
```

## 파일 구조

```
session-manager/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── save.md            ← /save 커맨드
│   ├── resume.md          ← /resume 커맨드
│   ├── note.md            ← /note 커맨드
│   └── done.md            ← /done 커맨드
├── skills/
│   └── note.md            ← note 스킬 (자연어 트리거)
├── conventions/
│   └── context-system.md  ← .ai/ 운영 규칙
├── hooks/
│   └── hooks.json         ← SessionStart + SessionEnd hook 등록
├── scripts/
│   ├── session-start.mjs  ← 시작 hook 스크립트
│   └── session-end.mjs    ← 종료 hook 스크립트
├── GUIDE.md
└── README.md
```

## 설계 히스토리

### v0 → v1: current.md 단일화
- v0 문제: 저장 대상 과다 (STATUS.md + DECISIONS.md + 세션 로그 + 습관 점수)
- v1 원칙: `current.md` 하나로 단순화

### v1 → v2: 지식 영속 저장
- v1 문제: 세션 지식 유실, 저장 기준 부재
- v2 추가: `/note` + `note` 스킬, SessionEnd 타임스탬프 갱신

### v2 → v3: active/ 기반 + /done
- v2 문제: current.md 단일 파일 → 병렬 작업 시 오염, 작업 완료 후 방치
- v3 변경: `active/{task}.md` 병렬 지원, `/done` 커맨드, `INDEX.md` 진입점, `conventions/` 운영 규칙
