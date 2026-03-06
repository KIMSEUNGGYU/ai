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
│   ├── spec-agent.ts    ← 기획문서 → 구현 스펙
│   ├── code-agent.ts    ← 스펙 → 코드 생성
│   └── review-agent.ts  ← 코드 리뷰
├── evaluators/
│   ├── spec-eval.ts     ← 스펙 품질 검증
│   ├── code-eval.ts     ← 코드 품질 검증
│   └── review-eval.ts   ← 리뷰 결과 검증
├── evals/results/       ← eval 실행 결과
├── types.ts             ← 공통 타입
├── conventions.ts       ← 플러그인 경로, 파일 로더
├── NOTES.md             ← 개념 정리 학습 노트
└── README.md            ← 이 파일
```

## 실행

```bash
# 스펙 직접 전달
pnpm fe-auto ./spec.md ~/work/ishopcare-frontend

# 기획문서 → 스펙 변환 모드
pnpm fe-auto --convert ./planning.md ~/work/ishopcare-frontend --ticket FE-456
```

## 파이프라인 흐름

```
입력 → [Spec Agent] → [Code Agent] ↔ [Review Agent] (Ralph 루프) → 결과
```

## 기술 스택

- Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- TypeScript (ESM)
- 모델: sonnet (Spec/Code), haiku (Review)
