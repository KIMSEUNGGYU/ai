# fe-workflow

FE 전용 플러그인 — 컨벤션 기반 구현, 코드 리뷰, 리팩토링.

## 워크플로우

```
/fe:fe-spec 기능명               →  스펙 작성
       ↓
/fe:implement                    →  구현 (code-writer → convention-checker 자동 검증)
       ↓
/fe:review                       →  리뷰 (code-reviewer Agent)
       ↓
/fe:refactor                     →  리팩토링 (refactorer Agent)
```

## 커맨드

| 커맨드 | 역할 | Agent |
|--------|------|-------|
| `/fe:fe-spec` | 페이지/기능 단위 FE 스펙 문서 작성 | 없음 |
| `/fe:implement` | 컨벤션 기반 코드 구현 (Phase별) + convention-checker 자동 검증 | code-writer (opus) + convention-checker (sonnet) |
| `/fe:review` | 컨벤션 기반 코드 리뷰 → 점수/피드백 | code-reviewer (opus) |
| `/fe:refactor` | 컨벤션 기반 리팩토링 (구조→로직→스타일) | refactorer (opus) |

## Agents

| Agent | 모델 | 역할 |
|-------|------|------|
| code-writer | opus | 컨벤션 내재화 코드 작성 + 자기검증 |
| convention-checker | sonnet | 구현 후 컨벤션 위반 검증 + 수정 지시 (읽기 전용) |
| code-reviewer | opus | 5개 영역 점수 + Must/Should/Nit 피드백 (읽기 전용) |
| refactorer | opus | 구조→로직→스타일 순서 리팩토링 |

## Skills

| Skill | 역할 |
|-------|------|
| fe-principles | FE 작업 시 워크플로우 안내 + conventions 참조 연결 |

## Conventions (5개)

agents가 references로 읽고 기준으로 적용하는 참조 문서:

| 파일 | 내용 |
|------|------|
| code-principles.md | SRP, SSOT, 추상화, 네이밍, 인지부하 |
| folder-structure.md | Page First, 지역성, models/ vs types/ |
| api-layer.md | httpClient, DTO, React Query, queryOptions |
| coding-style.md | Form, Zod, 이벤트 핸들러, Boolean Props, @tossteam/is |
| error-handling.md | ErrorBoundary, AppError, AsyncBoundary (비활성 — 파일 유지, 참조 제거) |

## Hooks

| 이벤트 | 동작 |
|--------|------|
| PostToolUse (Edit/Write) | harness-check.sh — grep 9개 규칙 즉시 체크 |

## 구조

```
fe-workflow/
├── .claude-plugin/
│   └── plugin.json           ← v0.34.0
├── agents/
│   ├── code-writer.md
│   ├── code-reviewer.md
│   ├── convention-checker.md
│   └── refactorer.md
├── commands/
│   ├── fe-spec.md
│   ├── implement.md
│   ├── review.md
│   └── refactor.md
├── conventions/              ← 5개
│   ├── code-principles.md
│   ├── folder-structure.md
│   ├── api-layer.md
│   ├── error-handling.md     ← 비활성
│   └── coding-style.md
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       └── harness-check.sh
└── skills/
    └── fe-principles/
        ├── SKILL.md
        └── references/       ← conventions/ 심링크
```
