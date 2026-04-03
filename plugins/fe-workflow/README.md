# fe-workflow

FE 전용 플러그인 — 하네스 기반 자동 구현 + 품질 평가.

## 워크플로우

```
/fe:harness "요구사항"          →  전체 파이프라인 (Planning → Build Loop → Summary)

개별 호출:
/fe:planning "요구사항"         →  스펙 생성 (소크라테스식 질문 + 모호성 체크)
/fe:implementing spec.md       →  구현 (Contract → Generate → Static Gate)
/fe:evaluating                 →  평가 (Contract + 열린 + Contrarian + Contract 검토 4단계)
```

## 커맨드

| 커맨드 | 역할 | Agent |
|--------|------|-------|
| `/fe:harness` | 통합 오케스트레이터 — Planning → Build Loop → Summary | planner + generator + evaluator |
| `/fe:planning` | 요구사항 → 스펙 확장 + Sprint 분해 | planner (opus) |
| `/fe:implementing` | Sprint Contract 기반 코드 구현 + Static Gate | generator (opus) + planner (contract) |
| `/fe:evaluating` | 4단계 코드 품질 평가 | evaluator (opus) |

## Agents

| Agent | 모델 | 역할 |
|-------|------|------|
| planner | opus | 스펙 확장 + Sprint 분해 + 소크라테스식 질문 + 모호성 체크 + Contract 초안 |
| generator | opus | Sprint Contract 기반 코드 구현. 참조 패턴 따르기. 자기검증 안 함. |
| evaluator | opus | Contract 기준(닫힌) + 열린 평가 + Contrarian(반대 관점) + Contract 검토 4단계 평가 |

## Skills

| Skill | 역할 |
|-------|------|
| fe-principles | FE 작업 시 워크플로우 안내 + conventions 참조 연결 |

## Conventions

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

## 하네스 파일

| 파일 | 역할 |
|------|------|
| harness/harness-config.md | 컨벤션 목록, Static Gate 명령, 평가 설정, 안전장치 |
| harness/templates/spec-template.md | spec.md 형식 |
| harness/templates/contract-template.md | contract.md 형식 |
| harness/templates/summary-template.md | summary.md 형식 |

## 구조

```
fe-workflow/
├── .claude-plugin/
│   └── plugin.json              ← v0.35.0
├── agents/
│   ├── planner.md
│   ├── generator.md
│   └── evaluator.md
├── commands/
│   ├── harness.md
│   ├── planning.md
│   ├── implementing.md
│   └── evaluating.md
├── conventions/                 ← 5개
│   ├── code-principles.md
│   ├── folder-structure.md
│   ├── api-layer.md
│   ├── error-handling.md        ← 비활성
│   └── coding-style.md
├── harness/
│   ├── harness-config.md
│   └── templates/
│       ├── spec-template.md
│       ├── contract-template.md
│       └── summary-template.md
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       └── harness-check.sh
└── skills/
    └── fe-principles/
        ├── SKILL.md
        └── references/          ← conventions/ 심링크
```
