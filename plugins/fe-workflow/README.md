# fe-workflow

FE 전용 플러그인 — 컨벤션 기반 구현, 코드 리뷰, 리팩토링.

## 워크플로우

```
/fe:fe-spec 기능명               →  스펙 작성
       ↓
/fe:implement                    →  구현 (code-writer Agent)
       ↓
/fe:review                       →  리뷰 (code-reviewer Agent)
       ↓
/fe:refactor                     →  리팩토링 (refactorer Agent)
       ↓
/fe:api-integrate @API경로       →  백엔드 API → FE 코드 생성
```

## 커맨드

| 커맨드 | 역할 | Agent |
|--------|------|-------|
| `/fe:fe-spec` | 페이지/기능 단위 FE 스펙 문서 작성 | 없음 |
| `/fe:implement` | 컨벤션 기반 코드 구현 (Phase별) | code-writer (opus) |
| `/fe:review` | 컨벤션 기반 코드 리뷰 → 점수/피드백 | code-reviewer (opus) |
| `/fe:refactor` | 컨벤션 기반 리팩토링 (구조→로직→스타일) | refactorer (opus) |
| `/fe:api-integrate` | 백엔드 API → FE 코드 자동 생성 | 없음 |

## Agents

| Agent | 모델 | 역할 |
|-------|------|------|
| code-writer | opus | 컨벤션 내재화 코드 작성 + 자기검증 |
| code-reviewer | opus | 5개 영역 점수 + Must/Should/Nit 피드백 (읽기 전용) |
| refactorer | opus | 구조→로직→스타일 순서 리팩토링 |

## Skills

| Skill | 역할 |
|-------|------|
| fe-principles | FE 작업 시 워크플로우 안내 + conventions 참조 연결 |

## Conventions (5개)

agents가 Read로 읽고 기준으로 적용하는 참조 문서:

| 파일 | 내용 |
|------|------|
| code-principles.md | SRP, SSOT, 추상화, 네이밍, 인지부하 |
| folder-structure.md | Page First, 지역성, models/ vs types/ |
| api-layer.md | httpClient, DTO, React Query, queryOptions |
| error-handling.md | ErrorBoundary, AppError, AsyncBoundary |
| coding-style.md | Form, Zod, 이벤트 핸들러, Boolean Props, @tossteam/is |

## Hooks

| 이벤트 | 동작 |
|--------|------|
| UserPromptSubmit | FE 프로젝트(react 의존성 존재)에서만 키워드 기반 컨벤션 자동 주입 |
| PostToolUse (Edit/Write) | 편집 후 harness-check + convention 검사 |

## 구조

```
fe-workflow/
├── .claude-plugin/
│   └── plugin.json           ← v0.30.0
├── agents/
│   ├── code-writer.md
│   ├── code-reviewer.md
│   └── refactorer.md
├── commands/
│   ├── fe-spec.md
│   ├── implement.md
│   ├── review.md
│   ├── refactor.md
│   └── api-integrate.md
├── conventions/              ← 5개
│   ├── code-principles.md
│   ├── folder-structure.md
│   ├── api-layer.md
│   ├── error-handling.md
│   └── coding-style.md
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       ├── fe-convention-prompt.sh
│       ├── harness-check.sh
│       └── post-edit-convention.sh
└── skills/
    └── fe-principles/SKILL.md
```
