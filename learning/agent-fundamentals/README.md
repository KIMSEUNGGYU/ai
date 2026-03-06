# agent-fundamentals

AI 에이전트 시스템의 핵심 패턴을 학습하기 위한 프로젝트.
기획문서/스펙을 입력받아 FE 코드를 자동 생성하는 파이프라인을 구현했다.

## 학습 목표

| 패턴 | 설명 | 코드 위치 |
|------|------|-----------|
| 오케스트레이션 | 서브에이전트 호출 순서 + 데이터 연결 | `main.ts` |
| Ralph (자기참조 루프) | 메타 분석 → 전략 진화 → 정체 감지 | `main.ts` (루프 안) |
| 하네스 (Eval) | 에이전트 출력 품질 자동 검증 | `evaluators/` |

## 구조

```
agent-fundamentals/
├── main.ts              ← 오케스트레이터 (파이프라인 + Ralph 루프)
├── agents/
│   ├── spec-agent.ts         ← 기획문서 → 구현 스펙
│   ├── code-agent.ts         ← 스펙 → 코드 생성
│   ├── review-agent.ts       ← 코드 리뷰 (Claude SDK)
│   └── review-agent-openai.ts ← 코드 리뷰 (Codex SDK)
├── evaluators/
│   ├── spec-eval.ts          ← 스펙 품질 검증
│   ├── code-eval.ts          ← 코드 품질 검증
│   └── review-eval.ts        ← 리뷰 결과 검증 + 점수 산출
├── test/                     ← 단위 테스트
├── evals/                    ← 테스트 스펙 파일 (시험 문제)
│   └── output/               ← 테스트 출력 (.gitignore)
├── types.ts             ← 공통 타입
├── conventions.ts       ← 플러그인 경로, 파일 로더
├── NOTES.md             ← 개념 정리 학습 노트
└── README.md            ← 이 파일
```

## 실행

```bash
# 스펙 직접 전달
unset CLAUDECODE && npx tsx main.ts ./spec.md ~/work/ishopcare-frontend

# 기획문서 → 스펙 변환 모드
unset CLAUDECODE && npx tsx main.ts --convert ./planning.md ~/work/ishopcare-frontend --ticket FE-456

# 리뷰어 선택 (기본: claude)
unset CLAUDECODE && npx tsx main.ts ./spec.md ./evals/output --reviewer openai
unset CLAUDECODE && npx tsx main.ts ./spec.md ./evals/output --reviewer both
```

## 테스트

### 에이전트 파이프라인 테스트

`learning/agent-fundamentals/` 디렉토리에서 실행해야 한다:

```bash
cd ~/dev/agents/learning/agent-fundamentals
```

`evals/` 폴더에 준비된 테스트 스펙으로 실행:

```bash
# 가벼운 유틸 함수 (비용 최소)
unset CLAUDECODE && npx tsx main.ts ./evals/spec-date-utils.md ./evals/output --reviewer openai

# API 파라미터 빌더
unset CLAUDECODE && npx tsx main.ts ./evals/spec-api-params.md ./evals/output --reviewer openai

# React 컴포넌트
unset CLAUDECODE && npx tsx main.ts ./evals/spec-status-badge.md ./evals/output --reviewer openai

# 멀티 모델 리뷰 (Claude + OpenAI 동시)
unset CLAUDECODE && npx tsx main.ts ./evals/spec-date-utils.md ./evals/output --reviewer both
```

| 스펙 | 난이도 | 포인트 |
|------|--------|--------|
| `spec-date-utils.md` | 쉬움 | 순수 함수, 조건 분기 |
| `spec-api-params.md` | 쉬움 | 타입 분기, 엣지 케이스 |
| `spec-status-badge.md` | 중간 | React + Tailwind |
| `test-spec.md` | 쉬움 | 가격 포맷 유틸 |

> `unset CLAUDECODE`는 Claude Code 환경 변수를 제거하여 SDK 에이전트가 정상 동작하도록 한다.

### 단위 테스트

```bash
npx tsx --test test/review-eval.test.ts
```

## 파이프라인 흐름

```
입력 → [Spec Agent] → [Code Agent] ↔ [Review Agent] (Ralph 루프) → 결과
```

## 기술 스택

- Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) — Code/Review 에이전트
- Codex SDK (`@openai/codex-sdk`) — OpenAI 리뷰 에이전트
- TypeScript (ESM)
- 모델: sonnet (Spec/Code), haiku (Claude Review), o4-mini (Codex Review)
