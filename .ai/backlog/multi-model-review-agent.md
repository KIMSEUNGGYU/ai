# Multi-Model Review Agent

> agent-fundamentals에 OpenAI 기반 리뷰 에이전트를 추가하여 멀티 모델 오케스트레이션 학습

## 배경

현재 agent-fundamentals의 Code↔Review 루프는 모두 Claude Agent SDK(Claude 모델)를 사용.
리뷰 에이전트를 OpenAI API로도 구현하여 멀티 모델 에이전트 패턴을 학습한다.

## 목표

- 기존 Claude 리뷰 에이전트 유지 + OpenAI 리뷰 에이전트 추가
- 오케스트레이터가 둘 다 실행하여 결과 비교
- diff로 변경점이 명확히 보이는 구조

## 구현 범위

### 1. OpenAI 리뷰 에이전트 (`agents/review-agent-openai.ts`)

- OpenAI API 직접 호출 (openai SDK)
- 모델: `gpt-4o` 또는 `o3` (환경변수로 선택)
- 동일한 인터페이스 (`AgentResult` 반환)
- 코드 내용은 프롬프트에 직접 포함 (도구 접근 없음)
- FE 컨벤션은 파일에서 읽어서 프롬프트에 주입

### 2. 오케스트레이터 변경 (`main.ts`)

- `--reviewer` 플래그 추가: `claude` (기본) | `openai` | `both`
- `both` 모드: 두 리뷰어 병렬 실행 → 결과 비교 출력

### 3. 의존성

- `openai` npm 패키지 추가
- `OPENAI_API_KEY` 환경변수 필요

## 변경하지 않는 것

- 기존 Claude 리뷰 에이전트 코드 (그대로 유지)
- spec-agent, code-agent (변경 없음)
- evaluators (기존 것 공유)
- Ralph 패턴 로직

## 파일 변경 예상

```
learning/agent-fundamentals/
├── agents/
│   ├── review-agent.ts          ← 기존 유지 (Claude)
│   └── review-agent-openai.ts   ← 신규 (OpenAI)
├── main.ts                      ← --reviewer 플래그 추가
├── package.json                 ← openai 의존성 추가
└── types.ts                     ← ReviewerType 타입 추가 (필요시)
```
