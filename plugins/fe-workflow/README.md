# fe-workflow

FE 전용 플러그인 — 컨벤션 기반 설계, 코드 리뷰, 성능 분석.

## 워크플로우

```
/fe:architecture 기능명      →  설계
       ↓
대화로 구현 요청              →  개발 (fe conventions 적용)
       ↓
/fe:review                   →  리뷰
       ↓
/fe:api-integrate @API경로   →  백엔드 API → FE 코드 생성
```

## 커맨드

| 커맨드 | 역할 | Agent |
|--------|------|-------|
| `/fe:architecture` | 컨벤션 기반 설계 → 구현 지시서 생성 | architect (opus) |
| `/fe:review` | 컨벤션 기반 코드 리뷰 → 점수/피드백 | code-reviewer (sonnet) |
| `/fe:api-integrate` | 백엔드 API → FE 코드 자동 생성 | 없음 |

## Agents

| Agent | 모델 | 역할 |
|-------|------|------|
| architect | opus | 컨벤션 기반 아키텍처 설계 (읽기 전용) |
| code-reviewer | sonnet | 5개 영역 점수 + Must/Should/Nit 피드백 |
| perf-optimizer | opus | React 렌더링 병목, 훅 최적화, 번들 분석 |
| refactor-analyzer | opus | 중복, 복잡도, 추상화 기회 분석 |

## Skills

| Skill | 역할 |
|-------|------|
| fe-principles | 코드 원칙 7개 (변경용이성, SSOT, SRP, 응집도, 선언적, 가독성, 인지부하) |

## Conventions (5개)

agents가 Read로 읽고 기준으로 적용하는 참조 문서:

| 파일 | 내용 |
|------|------|
| code-principles.md | SRP, SSOT, 추상화, 네이밍, 인지부하 |
| folder-structure.md | Page First, 지역성, models/ vs types/ |
| api-layer.md | httpClient, DTO, React Query, queryOptions |
| error-handling.md | ErrorBoundary, AppError, AsyncBoundary |
| coding-style.md | 불변성, async/await, Zod, 이벤트 핸들러, Boolean Props |

## 구조

```
fe-workflow/
├── .claude-plugin/
│   └── plugin.json           ← v0.10.0
├── agents/
│   ├── architect.md
│   ├── code-reviewer.md
│   ├── perf-optimizer.md
│   └── refactor-analyzer.md
├── commands/
│   ├── architecture.md
│   ├── review.md
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
│       └── post-edit-convention.sh
└── skills/
    └── fe-principles/SKILL.md
```
