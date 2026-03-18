---
title: FE 구현 품질 자동화 에이전트
date: 2026-03-15
status: draft
---

# fe-agent — FE 구현 품질 자동화 에이전트

## 문제

```
Claude Code에서 AI 구현 → 컨텍스트 오염 + 편향 → "이건 아닌데" 반복
패턴 불일치 35%, 컨벤션 위반 25%, 설계 문제, 사소한 규칙 미준수
(fe-workflow-개선.md 분석 데이터 기반)
```

## 해결

```
Mastra 워크플로우 + Claude CLI(`claude -p`)로 구현 + 자체 리뷰 루프 → 사람 검토
구독 계정 인증, 추가 비용 없음
```

## 핵심 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 오케스트레이션 | Mastra (`@mastra/core`) | 워크플로우 엔진, 병렬 실행, 조건부 루프 |
| LLM 호출 | `claude -p` CLI 래퍼 | 구독 계정 인증, API 키 불필요, 모델 선택 가능 |
| 위치 | `services/fe-agent/` | fe-auto와 별도 (목적이 다름) |
| 모델 | 구현: `--model sonnet` / 리뷰+반박: `--model opus` | 구현은 지시 실행, 리뷰는 판단력 필요 |
| 에이전트 구조 | 3개 CLI 호출 분리 (구현자, 리뷰어, 반박자) | 역할별 깨끗한 컨텍스트 |
| 트리거 | `pnpm fe-agent --spec <경로> --target <디렉토리>` | 수동 실행, 단계적 전환 |
| 컨벤션 참조 | fe-workflow conventions/ 직접 읽기 | SSOT 유지 |
| 스펙 입력 | `/fe:fe-spec` 출력 형식 호환 | 기존 워크플로우 활용 |

## 아키텍처

### LLM 호출 방식

```typescript
// claude CLI 래퍼 — 구독 계정 인증
function callClaude(prompt: string, model = 'sonnet'): string {
  const outFile = join(tmpdir(), `claude-${Date.now()}.txt`);
  execSync(`claude -p --model ${model} --output-file ${outFile} '${prompt}'`, {
    timeout: 120000,
  });
  const result = readFileSync(outFile, 'utf-8').trim();
  unlinkSync(outFile);
  return result;
}
```

**왜 이 방식인가:**
- `Mastra Agent.generate()` → Anthropic API 직접 호출 → API 키 필요 ❌
- `claude -p` → Claude Code CLI (공식 기능) → 구독 인증 ✅
- Anthropic이 금지하는 건 "제3자가 크레덴셜로 API 직접 호출". CLI 사용은 정상 사용

### 3개 역할

| 역할 | 모델 | 프롬프트 포함 내용 |
|------|------|-------------------|
| 구현자 | Sonnet | 스펙 + 컨벤션 5개 문서 |
| 리뷰어 | Opus | 생성된 코드 + 컨벤션 5개 문서 |
| 반박자 | Opus | 생성된 코드 + 컨벤션 5개 문서 |

핵심: 각 호출이 **독립된 `claude -p` 프로세스** → 구현 과정의 컨텍스트가 리뷰어에게 전달 안 됨.

### 실행 흐름

```
입력: pnpm fe-agent --spec .ai/specs/merchant-detail.md --target ~/work/project
         ↓
    ┌─ 준비 (Mastra step) ─────────────┐
    │ 1. conventions/ 5개 문서 로딩      │
    │ 2. 스펙 파싱                       │
    └──────────┬───────────────────────┘
               ↓
    ┌─ 구현 (claude -p --model sonnet) ─┐
    │ 스펙 + 컨벤션 기반 코드 작성        │
    └──────────┬───────────────────────┘
               ↓
    ┌─ 객관적 게이트 (결정적) ────────────┐
    │ tsc --noEmit    → 타입 에러 0      │
    │ biome lint      → 린트 에러 0      │
    │ harness-check   → 기계적 위반 0    │
    │ → 실패 시 구현자가 수정 후 재시도    │
    └──────────┬───────────────────────┘
               ↓
    ┌─ LLM 리뷰 루프 ───────────────────┐
    │                                     │
    │  리뷰어 (claude -p --model opus) ─┐ │
    │                                    ├→ 통합 피드백
    │  반박자 (claude -p --model opus) ─┘ │
    │         ↓  (병렬 실행)              │
    │                                     │
    │  must 위반 있으면:                   │
    │    구현자(sonnet)가 수정 → 재리뷰    │
    │                                     │
    │  종료 조건:                          │
    │  1. must = 0 → 성공                 │
    │  2. must 수 증가 → 중단 (악화)       │
    │  3. 같은 위반 반복 → 중단            │
    │  4. max 3회 → 중단 (안전장치)        │
    │                                     │
    └──────────┬───────────────────────┘
               ↓
    ┌─ 결과 출력 ────────────────────────┐
    │ 자동 해결: must 위반 수정 이력       │
    │ 사람 판단: should/nit 리포트        │
    │ 설계 제안: 반박자 피드백             │
    │ 미해결: 자동 수정 실패 항목          │
    └────────────────────────────────────┘
```

### 리뷰어 vs 반박자

| | 리뷰어 | 반박자 |
|---|---|---|
| 관점 | "컨벤션 지켰나?" | "이게 최선이야?" |
| 체크 | API 패턴, 네이밍, 폴더 구조, SSOT, 타입 | 컴포넌트 설계, 추상화 수준, 불필요한 복잡도 |
| 출력 | must / should / nit 위반 목록 | 설계 제안 (대안 포함) |
| 자동 수정 | must만 자동 수정 | 수정 안 함 (사람 판단용) |

## 컨벤션 참조

fe-workflow의 conventions/ 5개 문서를 프롬프트에 포함:
- `plugins/fe-workflow/conventions/code-principles.md`
- `plugins/fe-workflow/conventions/folder-structure.md`
- `plugins/fe-workflow/conventions/api-layer.md`
- `plugins/fe-workflow/conventions/error-handling.md`
- `plugins/fe-workflow/conventions/coding-style.md`

## 기존 시스템과의 관계

| 기존 | 관계 |
|------|------|
| fe-auto | 별도 서비스. fe-auto는 Linear→PR 파이프라인, fe-agent는 구현 품질 |
| fe-workflow (plugin) | 컨벤션 공유. harness-check.sh 로직 재사용 가능 |
| `/fe:implement` | 단계적 대체 대상 |
| `/fe:fe-spec` | 입력 형식 호환 |

## 단계적 전환

| 단계 | 내용 | 기준 |
|------|------|------|
| 1단계 | 에이전트 구축 + 수동 실행 | — |
| 2단계 | 실전 테스트 (2~3건) | "이건 아닌데" 빈도 감소 확인 |
| 3단계 | `/fe:implement`에서 호출 통합 | 2단계 통과 |
| 4단계 | Claude Code implement 대체 | 3단계 안정화 |

## 논의 과정에서 기각/보류된 것들

| 접근 | 결론 | 이유 |
|------|------|------|
| Mastra Agent.generate() 직접 | 기각 | Anthropic API 키 필요. 구독 계정 사용 불가 |
| Codex exec (OpenAI) | 기각 | 컨벤션이 Claude 최적화. GPT 모델은 컨벤션 이해도 떨어짐 |
| Codex OAuth 토큰 → Mastra | 기각 | 스코프 제한 (`api.responses.write` 없음) |
| Claude Agent SDK | 기각 | 구독 인증 공식 금지 ("third party developers") |
| Gemini 무료 모델 | 보류 | 워크플로우 검증용으로는 가능하나 품질 미보장 |
| 리뷰만 에이전트로 | 기각 | 구현도 깨끗한 컨텍스트에서 해야 근본 해결 |
| 기존 코드 패턴 분석 | 보류 | 컨벤션만으로 시작, 필요 시 추가 |
| 자동 수정 only | 기각 | 잘못된 수정 위험. 리포트 + 선택적 수정이 안전 |

## 기술 스택

```
services/fe-agent/
├── package.json          (@mastra/core, zod)
├── tsconfig.json
├── main.ts               CLI 진입점
├── GUIDE.md              Mastra 학습 가이드
└── src/
    └── mastra/
        ├── index.ts      Mastra 인스턴스
        ├── lib/
        │   └── claude.ts   claude -p CLI 래퍼
        ├── workflows/
        │   └── fe-implement.ts   메인 워크플로우
        └── tools/
            ├── file-tools.ts
            └── shell-tools.ts
```

**Mastra의 역할:**
- 워크플로우 오케스트레이션 (step 체이닝, 병렬 실행, 조건부 루프)
- step 간 데이터 전달 (Zod 스키마)
- 에러 핸들링, 관찰성

**claude CLI의 역할:**
- LLM 호출 (구독 인증)
- 모델 선택 (sonnet/opus)
- 깨끗한 컨텍스트 (매 호출이 독립 프로세스)

## 참고

- Ralph: https://github.com/snarktank/ralph ("Ralph only works if there are feedback loops")
- Mastra: https://mastra.ai/
- Claude Code CLI: `claude -p --model <model> --output-file <path> "prompt"`
- fe-workflow Phase 3 스펙: `.ai/specs/phase3-에이전트-아키텍처.md`
- 구현 품질 분석: `.ai/active/fe-workflow-개선.md`
