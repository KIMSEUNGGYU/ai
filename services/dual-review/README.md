# dual-review

Claude Code(Opus)가 FE 코드를 설계+구현하고, OpenAI Codex SDK가 코드리뷰하는 멀티 AI 파이프라인.

## 파이프라인

```
요구사항 (자연어)
  │
  ▼
[Design Agent] Claude Opus + fe-workflow
  │  컴포넌트 구조, 파일 목록, 타입, 구현 지시
  ▼
[Impl Agent] Claude Sonnet + fe-workflow
  │  실제 코드 생성/수정
  ▼
[Review Agent] Codex SDK (gpt-5.3-codex)
  │  diff 기반 코드 리뷰
  ▼
[Evaluator]
  ├─ CRITICAL/HIGH 있음 → Impl Agent 자동 수정 → 재리뷰 (최대 2회)
  └─ 통과 → 완료
```

## 실행

```bash
# 사전 준비: Codex CLI 로그인 (1회)
codex login

# 실행
pnpm dual-review "로그인 페이지에 소셜 로그인 추가" --target ~/work/ishopcare-frontend
```

`--target`을 생략하면 기본값 `~/work/ishopcare-frontend` 사용.

## 인증

| 도구 | 인증 방식 |
|------|-----------|
| Claude Agent SDK | 글로벌 설정 자동 사용 |
| Codex SDK | `codex login` (ChatGPT 구독) 또는 `CODEX_API_KEY` 환경변수 |

## 구조

```
services/dual-review/
├── main.ts              ← Orchestrator (CLI 파싱, 파이프라인 관리)
├── agents/
│   ├── design-agent.ts  ← Claude Opus: 컨벤션 기반 FE 설계
│   ├── impl-agent.ts    ← Claude Sonnet: 코드 구현 + 빌드 검증 루프
│   └── review-agent.ts  ← Codex SDK: 코드 리뷰 + 결과 파싱
├── evaluators/
│   └── review-eval.ts   ← CRITICAL/HIGH 판정 (정규식 + fallback)
├── conventions.ts       ← fe-workflow 플러그인 경로
├── types.ts             ← 공통 타입 (DualReviewInput, ReviewResult 등)
├── package.json
└── tsconfig.json
```

## Phase 로드맵

| Phase | 설명 | 상태 |
|-------|------|------|
| 1 | Claude Code 설계+구현, Codex 코드리뷰 | 현재 |
| 2 | Codex가 구현도 담당, Claude Code는 설계+오케스트레이션만 | 예정 |
| 3 | Opus가 완전 오케스트레이션, Codex가 구현 전담 | 예정 |

## 설계 문서

- [`docs/plans/2026-03-04-dual-review-design.md`](../../docs/plans/2026-03-04-dual-review-design.md) — 아키텍처, 타입, 에러 핸들링
- [`docs/plans/2026-03-04-dual-review-plan.md`](../../docs/plans/2026-03-04-dual-review-plan.md) — 구현 계획 (8 Task)
