# dual-review 설계 문서

> Claude Code(Opus) 설계+구현 → Codex SDK 코드리뷰 파이프라인

## 배경

- **Phase 1**: Claude Code가 설계+구현, Codex가 코드리뷰
- **궁극적 목표**: Opus가 오케스트레이션, Codex가 구현까지 담당
- **목적**: 학습/실험 — 두 AI SDK를 통합하는 멀티 에이전트 패턴 탐구

## 아키텍처

```
services/dual-review/
├── main.ts              ← Orchestrator (진입점)
├── agents/
│   ├── design-agent.ts  ← Claude Opus: 설계
│   ├── impl-agent.ts    ← Claude Opus: 구현
│   └── review-agent.ts  ← Codex SDK: 코드 리뷰
├── evaluators/
│   └── review-eval.ts   ← 리뷰 결과 파싱 & 판정
├── types.ts
├── package.json
└── tsconfig.json
```

## 파이프라인 플로우

```
입력(요구사항 + targetProject)
  │
  ▼
[Design Agent] Claude Opus + fe-workflow 플러그인
  │  → 컴포넌트 구조, 파일 목록, 인터페이스, 컨벤션 기반 구현 지시
  ▼
[Impl Agent] Claude Opus/Sonnet + fe-workflow 플러그인
  │  → 실제 파일 생성/수정 → git diff 생성
  ▼
[Review Agent] Codex SDK (@openai/codex-sdk)
  │  → diff 기반 구조화된 코드 리뷰
  ▼
[Review Evaluator]
  ├─ CRITICAL/HIGH 있음 → Impl Agent 피드백 → 수정 → 재리뷰 (최대 2회)
  └─ 통과 → 사용자 최종 확인 → 완료
```

## 에이전트 상세

### Design Agent

- **모델**: claude-opus-4-6
- **플러그인**: fe-workflow (컨벤션 참조)
- **입력**: 자연어 요구사항 또는 기획문서
- **동작**:
  1. 대상 프로젝트 구조/기존 코드 패턴 스캔
  2. 컨벤션에 맞는 컴포넌트 분해 & 파일 구조 설계
  3. 타입/인터페이스 정의
  4. Impl Agent용 구현 지시사항 (컨벤션 준수 사항 명시)
- **출력**: `DesignSpec` (components, files, interfaces, instructions, conventions)

### Impl Agent

- **모델**: claude-opus-4-6 (또는 sonnet으로 비용 절약)
- **플러그인**: fe-workflow
- **입력**: DesignSpec + 프로젝트 컨텍스트
- **동작**: 실제 파일 생성/수정 → git diff 생성
- **출력**: `ImplResult` (filesChanged, diff, cost)

### Review Agent

- **도구**: `@openai/codex-sdk`
- **입력**: git diff + 컨벤션 정보
- **리뷰 관점**: 코드 품질, 버그/로직 오류, 보안, FE 컨벤션, 타입 안전성
- **출력**: `ReviewResult` (issues, summary, pass)

## 타입 정의

```typescript
interface DesignSpec {
  components: ComponentDef[];
  files: FileSpec[];
  interfaces: string;
  instructions: string;
  conventions: string[];
}

interface ImplResult {
  filesChanged: string[];
  diff: string;
  cost: number;
}

interface ReviewResult {
  issues: Issue[];
  summary: string;
  pass: boolean; // CRITICAL/HIGH 0개면 true
}

interface Issue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}
```

## 에러 핸들링

| 상황 | 처리 |
|------|------|
| Design Agent 실패 | 에러 로그 + 종료 |
| Impl Agent 실패 | 1회 재시도, 실패 시 설계 산출물 + 에러 출력 |
| Codex SDK 연결 실패 | API 키 확인 안내 + 종료 |
| 리뷰 루프 2회 초과 | 현재 상태 + 남은 이슈 출력 → 사용자 판단 |

## 기술 스택

- **Claude Agent SDK**: `@anthropic-ai/claude-agent-sdk`
- **Codex SDK**: `@openai/codex-sdk`
- **런타임**: Node.js 22, ESM, TypeScript strict
- **환경변수**: `CODEX_API_KEY` (Codex SDK 인증)

## 실행

```bash
pnpm dual-review "로그인 페이지에 소셜 로그인 추가" --target ~/work/ishopcare-frontend
```

## Phase 로드맵

| Phase | 설명 |
|-------|------|
| **1 (현재)** | Claude Code 설계+구현, Codex 코드리뷰 |
| **2** | Codex가 구현도 담당, Claude Code는 설계+오케스트레이션만 |
| **3** | Opus가 완전 오케스트레이션, Codex가 구현 전담 |
