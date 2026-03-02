# fe-auto 에이전트 아키텍처

## 개요
FE 개발 작업을 완전 자동화하는 SDK 에이전트.
Linear 티켓 + 디자인 입력 → 스펙 → 코드 → 리뷰 → PR.
각 단계에 평가 루프 포함.

## 구조

```
services/fe-auto/
├── main.ts              ← Orchestrator (진입점)
├── agents/
│   ├── spec-agent.ts    ← 스펙 생성 + 평가 루프
│   ├── code-agent.ts    ← 코드 생성 + 평가 루프
│   └── review-agent.ts  ← 리뷰 + 평가 루프
├── evaluators/
│   ├── spec-eval.ts     ← 스펙 평가 (요구사항 커버리지)
│   ├── code-eval.ts     ← 코드 평가 (빌드/타입/컨벤션)
│   └── review-eval.ts   ← 리뷰 결과 판정
├── types.ts             ← 공통 타입
└── package.json
```

## 흐름

```
입력 (Linear 티켓 ID + 디자인)
  ↓
┌─ Spec Agent ─────────────────┐
│ 1. Linear MCP → 티켓 조회     │
│ 2. 스펙 초안 생성              │
│ 3. spec-eval: 평가             │
│    - 필수 섹션 존재?           │
│    - 요구사항 누락?            │
│ 4. 실패 → 재생성 (max 3회)    │
└──────────────────────────────┘
  ↓ 스펙 확정
┌─ Code Agent ─────────────────┐
│ 1. 스펙 + 디자인 읽기          │
│ 2. 기존 유사 코드 참조         │
│ 3. 코드 생성                   │
│ 4. code-eval: 평가             │
│    - tsc 타입체크 통과?        │
│    - 빌드 성공?                │
│    - FE 컨벤션 준수?           │
│ 5. 실패 → 에러 피드백 + 수정   │
│    (max 5회)                   │
└──────────────────────────────┘
  ↓ 코드 통과
┌─ Review Agent ───────────────┐
│ 1. 생성된 코드 리뷰            │
│ 2. review-eval: 평가           │
│    - CRITICAL 이슈 0개?       │
│    - HIGH 이슈 0개?           │
│ 3. 실패 → Code Agent로 복귀   │
│    (max 2회)                   │
└──────────────────────────────┘
  ↓ 리뷰 통과
PR 생성 → 사람 검수

## 평가 기준

### Spec Agent
- [ ] 요구사항 섹션 존재
- [ ] UI 컴포넌트 목록 존재
- [ ] API 엔드포인트 목록 존재
- [ ] 페이지 구조(라우트) 정의

### Code Agent
- [ ] `tsc --noEmit` 통과
- [ ] 빌드 성공
- [ ] FE 컨벤션: interface/type 구분, useSuspenseQuery, 도메인 폴더 구조
- [ ] API 연결 코드 존재

### Review Agent
- [ ] CRITICAL 이슈 0개
- [ ] HIGH 이슈 0개
- [ ] MEDIUM 이슈 3개 이하

## 입력 방식

### Linear 티켓
- Linear MCP로 자동 조회
- 티켓 제목, 설명, 라벨, 댓글

### 디자인
- 방식 B: 내가 빈 페이지에 컴포넌트 구조(레이아웃) 배치 → AI가 로직+API 채움
- Deus 컴포넌트 코드는 참고용으로 제공 가능

## 기존 플러그인과의 관계
- fe:architect → Code Agent가 내부적으로 참조하는 패턴
- fe:api-integrate → Code Agent가 API 연결 시 참조
- fe:code-reviewer → Review Agent의 평가 기준
- dev:pr → Orchestrator가 최종 단계에서 호출
```

## 기술 스택
- Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- MCP: Linear, 파일시스템
- 모델: sonnet (코드 생성 품질), haiku (평가)
- TypeScript ESM
