# AI Agent 기본기 — 에이전틱 패턴 학습 노트

> AI 에이전트의 핵심 패턴을 실제 코드로 이해하기 위한 학습 노트.
> fe-auto 프로젝트를 해부하며 오케스트레이션, Ralph, 하네스, 멀티 모델 오케스트레이션을 학습한다.

---

## 목차

1. [프로젝트 전체 흐름](#1-프로젝트-전체-흐름)
2. [오케스트레이터 — main.ts 전체 해부](#2-오케스트레이터--maints-전체-해부)
3. [서브에이전트 — 공통 패턴과 개별 역할](#3-서브에이전트--공통-패턴과-개별-역할)
4. [하네스 (Eval) — 에이전트 출력 검증](#4-하네스-eval--에이전트-출력-검증)
5. [Ralph 패턴 — 자기참조 진화 루프](#5-ralph-패턴--자기참조-진화-루프)
6. [데이터 흐름 추적 — 변수별 생명주기](#6-데이터-흐름-추적--변수별-생명주기)
7. [비유와 멘탈 모델](#7-비유와-멘탈-모델)
8. [한계와 트레이드오프](#8-한계와-트레이드오프)
9. [멀티 모델 오케스트레이션 — Claude + OpenAI 병렬 리뷰](#9-멀티-모델-오케스트레이션--claude--openai-병렬-리뷰)

---

## 1. 프로젝트 전체 흐름

### 파일 구조와 역할

```
services/fe-auto/
├── main.ts              ← 오케스트레이터: 누가 언제 뭘 할지 결정
├── agents/
│   ├── spec-agent.ts    ← 기획문서 → 구현 스펙 변환
│   ├── code-agent.ts    ← 스펙 → 코드 생성
│   └── review-agent.ts  ← 생성된 코드 리뷰
├── evaluators/
│   ├── spec-eval.ts     ← 스펙 품질 검증 (6개 섹션 존재?)
│   ├── code-eval.ts     ← 코드 품질 검증 (빌드 에러?)
│   └── review-eval.ts   ← 리뷰 결과 검증 (CRITICAL 이슈?)
├── types.ts             ← 공통 타입
└── conventions.ts       ← 플러그인 경로, 파일 로더
```

### 전체 파이프라인

```
입력 (기획문서 또는 스펙 파일)
  │
  ▼
[Spec Agent] ─── 기획문서를 구현 스펙으로 변환 (--convert 모드일 때만)
  │
  ▼
┌─────────────────────── Code ↔ Review 루프 (Ralph) ───────────────────────┐
│                                                                          │
│  [Code Agent] ─── 스펙 보고 코드 생성 ──→ [Review Agent] ─── 리뷰+점수   │
│       ↑                                         │                        │
│       │         [오케스트레이터: 메타 분석]         │                        │
│       │         "왜 실패? 전략 바꿀까?"            │                        │
│       │                ↓                         │                        │
│       └──── 메타 분석 + 피드백을 프롬프트로 ←───────┘                        │
│                                                                          │
│  종료 조건: 리뷰 통과 / 점수 90+ / 최대 5사이클                              │
└──────────────────────────────────────────────────────────────────────────┘
  │
  ▼
결과 요약 (비용, 통과 여부)
```

---

## 2. 오케스트레이터 — main.ts 전체 해부

오케스트레이터는 직접 코드를 생성하거나 리뷰하지 않는다.
**누가 언제 뭘 할지 결정**하고, **이전 결과를 다음에 연결**하는 게 전부다.

### Case 1: 입력 파싱 — "어떤 모드로 실행할지"

```typescript
// main.ts:13-51
function parseArgs(): FeAutoInput {
  const args = process.argv.slice(2);
  const specPath = args[0];

  // 사용법 안내
  if (!specPath) {
    console.error("사용법:");
    console.error("  pnpm fe-auto <스펙파일> [프로젝트경로]");
    console.error("  pnpm fe-auto --convert <기획문서> [프로젝트경로] [--ticket LINEAR-123]");
    process.exit(1);
  }

  // --convert 플래그가 있으면 "기획문서 → 스펙 변환" 모드
  const convertIdx = args.indexOf("--convert");
  const ticketIdx = args.indexOf("--ticket");

  if (convertIdx !== -1) {
    const docPath = args[convertIdx + 1];
    if (!docPath) {
      console.error("--convert 뒤에 기획문서 경로가 필요합니다");
      process.exit(1);
    }
    const projectPath = args.find(
      (a, i) => i > convertIdx + 1 && !a.startsWith("--")
    ) || "~/work/ishopcare-frontend";

    return {
      specPath: docPath,
      projectPath,
      convertSpec: true,                                    // ← 이 플래그로 모드 분기
      ticketId: ticketIdx !== -1 ? args[ticketIdx + 1] : undefined,
    };
  }

  // --convert 없으면 "스펙 직접 전달" 모드
  const projectPath = args[1] || "~/work/ishopcare-frontend";
  return { specPath, projectPath };
}
```

**포인트**: `convertSpec: true`이면 Spec Agent를 먼저 거치고, 아니면 바로 Code Agent로 간다.

### Case 2: 스펙 준비 — "Spec Agent 거칠지 말지"

```typescript
// main.ts:57-86
async function main() {
  const input = parseArgs();
  const rawDoc = loadSpec(input.specPath);  // 파일 읽기 (conventions.ts)

  let spec: string;      // ← 이 변수가 이후 전체 파이프라인의 "기준"
  let totalCost = 0;     // ← 모든 에이전트 비용 누적

  // ── Case A: 기획문서 → Spec Agent가 스펙으로 변환 ──
  if (input.convertSpec) {
    console.log("═".repeat(50));
    console.log("fe-auto 시작 (기획문서 → 스펙 변환 모드)");
    console.log(`기획문서: ${input.specPath}`);
    console.log(`프로젝트: ${input.projectPath}`);
    if (input.ticketId) console.log(`티켓: ${input.ticketId}`);
    console.log("═".repeat(50));

    const specResult = await runSpecAgent({   // Spec Agent 호출
      planningDoc: rawDoc,                     // 기획문서 원본 전달
      ticketId: input.ticketId,                // Linear 티켓 (선택)
    });
    spec = specResult.output;                  // Spec Agent의 출력이 spec이 됨
    totalCost += specResult.cost;

  // ── Case B: 스펙 파일 직접 전달 (변환 불필요) ──
  } else {
    console.log("═".repeat(50));
    console.log("fe-auto 시작");
    console.log(`스펙: ${input.specPath}`);
    console.log(`프로젝트: ${input.projectPath}`);
    console.log("═".repeat(50));
    spec = rawDoc;                             // 원본 파일이 그대로 spec
  }

  const state: PipelineState = { input, spec };
  // state.spec은 여기서 결정된 후 이후 루프에서 변하지 않는다 (읽기 전용)
```

**포인트**: `spec`은 한 번 결정되면 **고정**. 루프에서 바뀌는 건 `reviewFeedback`(메타 분석)이다.

### Case 3: Code ↔ Review 루프 (Ralph 패턴)

```typescript
  // main.ts:90-175
  // ── Code ↔ Review 루프 (Ralph 패턴: 자기참조 + 전략 진화) ──
  console.log("\n[Pipeline] Code → Review 루프 (Ralph)");

  let reviewPassed = false;
  let codeOutput = "";
  let reviewFeedback = "";                         // 매 사이클 갱신 — Code Agent에 전달
  let previousStrategy = "스펙 기반 초기 구현";       // 현재 전략 (메타 분석용)
  const scoreHistory: number[] = [];                // 점수 누적 — 추이 분석용

  for (let cycle = 0; cycle < MAX_CODE_REVIEW_CYCLES; cycle++) {
    console.log(`\n--- Cycle ${cycle + 1}/${MAX_CODE_REVIEW_CYCLES} ---`);
    console.log(`[전략] ${previousStrategy}`);

    // ────── Step 1: Code Agent 호출 ──────
    // 첫 사이클: 스펙만 보고 생성
    // 이후 사이클: 스펙 + 메타 분석(reviewFeedback)을 함께 전달
    const codeResult = await runCodeAgent(
      input,
      state.spec,                                   // 항상 같은 스펙 (고정)
      cycle > 0 ? reviewFeedback : undefined         // 첫 사이클엔 피드백 없음
    );
    codeOutput = codeResult.output;
    totalCost += codeResult.cost;

    // ────── Step 2: Review Agent 호출 ──────
    // Code Agent가 만든 코드를 스펙 기준으로 리뷰
    const reviewResult = await runReviewAgent(
      input.projectPath,
      state.spec,                                   // 같은 스펙으로 리뷰
      codeOutput                                     // Code Agent의 출력
    );
    totalCost += reviewResult.cost;

    // ────── Step 3: 점수 추출 ──────
    // Review Agent 출력에서 "75/100" 같은 패턴을 찾아 숫자로 변환
    const scoreMatch = reviewResult.output.match(/(\d+)\s*[/\/]\s*100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    scoreHistory.push(score);
    console.log(`[점수] ${score}/100 (히스토리: ${scoreHistory.join(" → ")})`);

    // ────── Step 4: 통과 판정 ──────
    if (
      reviewResult.output.includes("통과") ||
      reviewResult.output.includes("이슈 없음") ||
      score >= 90                                    // 90점 이상이면 자동 통과
    ) {
      reviewPassed = true;
      state.reviewResult = reviewResult.output;
      console.log("[Ralph] 검증 통과!");
      break;                                         // 루프 탈출
    }

    // ────── Step 5: Ralph — 정체 감지 ──────
    // 최근 N회 점수가 거의 같으면(변동 ≤5점) "정체"로 판단
    if (scoreHistory.length >= STAGNATION_THRESHOLD) {
      const recent = scoreHistory.slice(-STAGNATION_THRESHOLD);
      const isStagnant = recent.every((s) => Math.abs(s - recent[0]) <= 5);
      // 예: [70, 72] → |72-70|=2 ≤ 5 → 정체!
      // 예: [70, 82] → |82-70|=12 > 5 → 정체 아님
      if (isStagnant) {
        console.log("[Ralph] 정체 감지! 전략을 근본적으로 전환합니다.");
        previousStrategy = `이전 전략(${previousStrategy})이 ${STAGNATION_THRESHOLD}회 연속 정체 → 완전히 다른 접근으로 전환. 기존 코드를 버리고 구조부터 재설계`;
      }
    }

    // ────── Step 6: Ralph — 메타 분석 (자기참조의 핵심) ──────
    // "점수가 올라가고 있는가?"를 판단
    const scoreImproving = scoreHistory.length >= 2 &&
      score > scoreHistory[scoreHistory.length - 2];
    // 예: [60, 72] → 72 > 60 → true (개선 중)
    // 예: [72, 68] → 68 > 72 → false (하락)

    // 메타 분석 문서를 조립 — 이게 다음 사이클에서 Code Agent의 프롬프트가 된다
    const metaAnalysis = [
      `## 메타 분석 (Cycle ${cycle + 1})`,
      `- 현재 점수: ${score}/100`,
      `- 점수 추이: ${scoreHistory.join(" → ")} (${scoreImproving ? "개선 중" : "정체/하락"})`,
      `- 이전 전략: ${previousStrategy}`,
      `- 전략 평가: ${scoreImproving ? "방향은 맞음, 같은 방향으로 더 깊이 개선" : "접근법 자체를 바꿔야 함"}`,
      "",
      `## 리뷰 피드백`,
      reviewResult.output,                         // Review Agent의 원본 피드백도 포함
      "",
      `## 다음 전략 지시`,
      scoreImproving
        ? "현재 방향이 효과적이므로 리뷰 피드백의 구체적 지적사항만 집중 수정하세요."
        : "이전 접근이 효과가 없었습니다. 왜 실패했는지 근본 원인을 분석하고, 코드 구조/설계 자체를 다르게 접근하세요.",
    ].join("\n");

    reviewFeedback = metaAnalysis;                  // ← 이게 다음 사이클의 Code Agent 입력
    previousStrategy = scoreImproving
      ? `${previousStrategy} → 피드백 반영 심화`
      : `전략 전환: 리뷰 실패 원인 기반 재설계`;

    console.log(
      `Cycle ${cycle + 1} 리뷰 미통과. ${scoreImproving ? "개선 중 →" : "전략 전환 →"} ${cycle + 1 < MAX_CODE_REVIEW_CYCLES ? "재시도..." : "최대 사이클 도달."}`
    );
  }
```

**포인트**: Step 5~6이 Ralph의 핵심. 이 부분이 없으면 "단순 재시도 루프"가 된다.

### Case 4: 결과 요약

```typescript
  // main.ts:177-190
  console.log("\n" + "═".repeat(50));
  console.log("결과 요약");
  console.log("═".repeat(50));
  console.log(`스펙: ${input.specPath}`);
  console.log(`총 비용: $${totalCost.toFixed(4)}`);     // 모든 에이전트 비용 합산
  console.log(`리뷰: ${reviewPassed ? "통과" : "이슈 있음 (수동 확인 필요)"}`);
  console.log("\nPR 생성은 검수 후 수동으로 진행하세요.");
}

main().catch((err) => {
  console.error("에러:", err.message);
  process.exit(1);
});
```

---

## 3. 서브에이전트 — 공통 패턴과 개별 역할

### 3개 서브에이전트 모두 동일한 골격을 따른다

```typescript
// 모든 서브에이전트의 공통 구조 (spec-agent.ts, code-agent.ts, review-agent.ts)
export async function runXxxAgent(input): Promise<AgentResult> {
  let sessionId: string | undefined;   // SDK 세션 ID — 재시도 시 대화 컨텍스트 유지
  let lastResult = "";                  // 마지막 응답 — 재시도 시 피드백으로 사용

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    // ── SDK query() 호출 ──
    for await (const message of query({
      prompt: isFirst
        ? buildPrompt(input)            // 첫 호출: 정식 프롬프트
        : lastResult,                   // 재시도: 평가 피드백을 프롬프트로
      options: {
        model: "sonnet",
        systemPrompt: SYSTEM_PROMPT,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        ...(isFirst ? {} : { resume: sessionId }),  // 재시도 시 세션 이어서
      },
    })) {
      const msg = message as any;

      // 세션 ID 캡처 (최초 1회)
      if (msg.type === "system" && msg.subtype === "init" && !sessionId) {
        sessionId = msg.session_id;
      }

      // 도구 사용 로깅
      if (msg.type === "assistant") {
        const toolUses = msg.message?.content?.filter(
          (c: any) => c.type === "tool_use"
        );
        if (toolUses?.length) {
          for (const t of toolUses) console.log(`    도구: ${t.name}`);
        }
      }

      // 최종 결과 캡처
      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        turns = msg.num_turns ?? 0;
        cost = msg.total_cost_usd ?? 0;
      }
    }

    // ── 하네스로 평가 ──
    const evaluation = evaluateXxx(lastResult);

    if (evaluation.pass) {
      return { output: lastResult, sessionId, turns, cost };  // 통과 → 반환
    }

    // 미통과 → 피드백을 다음 프롬프트로 사용
    if (attempt < MAX_RETRIES) {
      lastResult = evaluation.feedback;
    }
  }

  return { output: lastResult, sessionId, turns: 0, cost: 0 };  // 최대 재시도 후 현재 결과 반환
}
```

**세션 유지(`resume`)가 중요한 이유**:
- `resume: sessionId`를 쓰면 이전 대화를 기억한 상태에서 피드백을 반영
- 안 쓰면 매번 새 대화 — 이전 맥락이 사라져서 같은 실수를 반복할 수 있음

### 개별 에이전트 차이점

#### Spec Agent (`agents/spec-agent.ts`)

```typescript
// spec-agent.ts — 핵심 부분만

const SPEC_SYSTEM_PROMPT = `당신은 기획문서를 FE 구현 스펙으로 변환하는 전문가입니다.

## 핵심 역할
기획문서에서 **구현에 필요한 정보만 추출**하여, Code Agent가 바로 작업할 수 있는
구조화된 스펙을 생성합니다.

## 기획문서에서 추출할 것
- 사용자 행동/인터랙션 (뭘 클릭하면 뭐가 나온다)
- 화면 구성 요소 (어떤 UI가 필요한지)
- 데이터 흐름 (어디서 데이터를 가져와서 어디에 보여주는지)
- 비즈니스 규칙 (조건부 표시, 유효성 검증 등)
- API 관련 언급 (엔드포인트, 파라미터, 응답 구조)

## 기획문서에서 무시할 것 (노이즈)
- 프로젝트 배경, 목적, 비즈니스 임팩트
- 의사결정 히스토리, 회의 기록
- 마케팅/운영 관련 내용

## 출력 포맷 (반드시 이 구조로 작성)
### 1. 요구사항        ← MUST/SHOULD/MAY 우선순위
### 2. 컴포넌트 구조    ← ASCII 트리 + props
### 3. API 계약         ← HTTP 메서드 + 경로 + 타입
### 4. 폴더 구조        ← Page First 원칙
### 5. 스코프 아웃       ← 이번에 안 하는 것
### 6. 확인 필요         ← 정보 부족한 부분`;

export async function runSpecAgent(input: SpecInput): Promise<AgentResult> {
  // ... 공통 골격과 동일
  // 모델: sonnet (정확한 구조 생성 필요)
  // 재시도: 최대 3회
  // 평가: evaluateSpec() — 6개 필수 섹션 존재 여부 확인
}
```

**역할**: 기획문서의 노이즈(배경, 목적, 일정)를 걸러내고 **구현에 필요한 것만** 구조화.

#### Code Agent (`agents/code-agent.ts`)

```typescript
// code-agent.ts — 핵심 부분만

function buildCodePrompt(input: FeAutoInput, spec: string, reviewFeedback?: string): string {
  let prompt = `아래 스펙에 따라 ${input.projectPath}에 FE 코드를 생성하세요.

## 스펙 (내가 작성한 문서)
${spec}

## 작업 순서
1. 프로젝트에서 유사한 페이지/기능을 찾아 패턴 파악
2. 스펙에 정의된 폴더 구조대로 파일 생성
3. models/ → DTO 타입 정의
4. remotes/ → API 함수 (httpClient, *Params 객체)
5. queries/ → queryOptions 팩토리 (queryKey 계층적)
6. mutations/ → mutationOptions 팩토리 (onSuccess → invalidateQueries)
7. 페이지 컴포넌트 구현 (useSuspenseQuery, Suspense/ErrorBoundary)
8. tsc --noEmit 으로 타입 체크
9. 결과 보고 (생성 파일 목록, 에러 여부)`;

  // ── Ralph에서 온 메타 분석이 여기에 붙는다 ──
  if (reviewFeedback) {
    prompt += `\n\n## 이전 리뷰 피드백 (반드시 반영)
${reviewFeedback}`;
    // reviewFeedback 안에는:
    // - 메타 분석 (점수 추이, 전략 평가)
    // - 리뷰 원본 피드백
    // - 다음 전략 지시
    // 가 모두 포함되어 있다
  }

  return prompt;
}

export async function runCodeAgent(...): Promise<AgentResult> {
  // ... 공통 골격과 동일
  // 모델: sonnet (코드 생성 품질 중요)
  // 재시도: 최대 5회
  // 평가: evaluateCode() — 빌드/타입 에러 확인
  // 플러그인: fe-workflow (FE 컨벤션 주입)
}
```

**역할**: 스펙을 보고 실제 파일을 생성. fe-workflow 플러그인이 FE 컨벤션을 시스템에 주입한다.

#### Review Agent (`agents/review-agent.ts`)

```typescript
// review-agent.ts — 핵심 부분만

function buildReviewPrompt(projectPath: string, spec: string, codeOutput: string): string {
  return `${projectPath}에 생성된 코드를 리뷰하세요.

## 원본 스펙
${spec}

## 생성된 코드 정보
${codeOutput}

## 리뷰 기준
시스템에 주입된 FE 컨벤션을 기준으로 리뷰하세요.
각 이슈에 심각도를 표시하세요: CRITICAL / HIGH / MEDIUM / LOW
이슈가 없으면 "리뷰 통과. 이슈 없음." 출력.`;
}

const REVIEW_SYSTEM_PROMPT = `당신은 사내 FE 프로젝트의 코드 리뷰 전문가입니다.

## 출력 형식
각 이슈를 아래 형식으로:
- [CRITICAL/HIGH/MEDIUM/LOW] {파일}:{라인} — {설명}

이슈가 없으면 "리뷰 통과. 이슈 없음." 출력.

## 판단 기준
- CRITICAL: 컨벤션 핵심 규칙 위반 (interface/type 혼용, 직접 fetch, mutate 콜백 패턴)
- HIGH: 패턴 불일치 (queryKey 비계층적, staleTime 미설정, 명령형 로딩 분기)
- MEDIUM: 스타일 이슈 (네이밍, 폴더 위치)
- LOW: 개선 제안`;

export async function runReviewAgent(...): Promise<AgentResult> {
  // ... 공통 골격과 동일
  // 모델: haiku (비용 절약 — 리뷰는 상대적으로 단순)
  // 재시도: 최대 2회
  // 평가: evaluateReview() — CRITICAL/HIGH 이슈 수 확인
  // 플러그인: fe-workflow (FE 컨벤션 주입)
}
```

**역할**: Code Agent가 만든 코드를 FE 컨벤션 기준으로 리뷰. haiku를 써서 비용 절약.

### 에이전트 비교표

| | Spec Agent | Code Agent | Review Agent |
|---|---|---|---|
| **파일** | `spec-agent.ts` | `code-agent.ts` | `review-agent.ts` |
| **모델** | sonnet | sonnet | haiku |
| **입력** | 기획문서 + 티켓ID | 스펙 + 리뷰피드백 | 프로젝트경로 + 스펙 + 코드 |
| **출력** | 구조화된 스펙 | 생성된 코드 정보 | 이슈 목록 (심각도별) |
| **플러그인** | 없음 | fe-workflow | fe-workflow |
| **재시도** | 3회 | 5회 | 2회 |
| **하네스** | spec-eval | code-eval | review-eval |

---

## 4. 하네스 (Eval) — 에이전트 출력 검증

하네스는 **"이 출력이 최소 기준을 충족하는가?"**를 코드로 판단하는 함수다.
에이전트의 출력(문자열)을 받아서 `{ pass, feedback }`을 반환한다.

### 공통 타입

```typescript
// types.ts
interface EvalResult {
  pass: boolean;                      // 통과 여부
  feedback: string;                   // 실패 시 피드백 (재시도 프롬프트로 사용)
  details?: Record<string, boolean>;  // 개별 체크 결과
}
```

### spec-eval.ts — "스펙 문서가 완성됐는가?"

```typescript
// evaluators/spec-eval.ts — 전체 코드
export function evaluateSpec(spec: string): EvalResult {
  const checks = {
    // ── 필수 섹션 6개가 존재하는지 정규식으로 확인 ──
    hasRequirements: /##.*요구사항/i.test(spec),
    hasComponents: /##.*컴포넌트/i.test(spec),
    hasApi: /##.*API/i.test(spec),
    hasStructure: /##.*폴더/i.test(spec),
    hasScopeOut: /##.*스코프\s*아웃/i.test(spec),
    hasOpenQuestions: /##.*확인\s*필요/i.test(spec),

    // ── 구조적 품질 (내용의 질) ──
    hasPriorityTags:                                // [MUST] 같은 우선순위 태그
      /\[MUST\]/i.test(spec) || /\[SHOULD\]/i.test(spec),
    hasComponentTree:                               // ASCII 트리 + props
      /├──|└──/.test(spec) && /props:/i.test(spec),
    hasApiSignature:                                // GET /api/... 형식
      /(GET|POST|PUT|DELETE|PATCH)\s+\//.test(spec),
  };

  const missing: string[] = [];
  const quality: string[] = [];

  // 필수 섹션 체크
  if (!checks.hasRequirements) missing.push("요구사항 섹션");
  if (!checks.hasComponents) missing.push("컴포넌트 구조 섹션");
  if (!checks.hasApi) missing.push("API 계약 섹션");
  if (!checks.hasStructure) missing.push("폴더 구조 섹션");
  if (!checks.hasScopeOut) missing.push("스코프 아웃 섹션");
  if (!checks.hasOpenQuestions) missing.push("확인 필요 섹션");

  // 품질 체크
  if (!checks.hasPriorityTags)
    quality.push("요구사항에 [MUST]/[SHOULD]/[MAY] 태그 필요");
  if (!checks.hasComponentTree)
    quality.push("컴포넌트 구조를 ASCII 트리(├──) + props로 작성 필요");
  if (!checks.hasApiSignature)
    quality.push("API 계약에 HTTP 메서드 + 경로 형식 필요 (GET /api/...)");

  console.log(`  스펙 평가: ${Object.entries(checks).map(([k, v]) => `${k}=${v}`).join(" ")}`);

  // 필수 섹션 누락 → 실패
  if (missing.length > 0) {
    return {
      pass: false,
      feedback: `스펙 불완전.\n누락 섹션: ${missing.join(", ")}\n반드시 모든 6개 섹션을 포함하세요.`,
      details: checks,
    };
  }

  // 품질 미달 → 실패 (보완 기회)
  if (quality.length > 0) {
    return {
      pass: false,
      feedback: `섹션은 모두 있지만 구조적 품질 개선 필요:\n${quality.map((q) => `- ${q}`).join("\n")}`,
      details: checks,
    };
  }

  return { pass: true, feedback: "", details: checks };
}
```

**실패 케이스 예시**:
- 스펙에 "## API 계약" 섹션이 없으면 → `pass: false`, `feedback: "누락 섹션: API 계약 섹션"`
- 섹션은 다 있지만 `[MUST]` 태그가 없으면 → `pass: false`, `feedback: "요구사항에 [MUST]/[SHOULD] 태그 필요"`

### code-eval.ts — "코드에 에러가 없는가?"

```typescript
// evaluators/code-eval.ts — 전체 코드
export function evaluateCode(agentOutput: string): EvalResult {
  const checks = {
    // 에이전트 출력 텍스트에서 에러 패턴을 정규식으로 탐지
    noBuildError: !/error TS\d+|build failed|compilation error/i.test(agentOutput),
    noTypeError: !/type.*error|cannot find.*module|is not assignable/i.test(agentOutput),
    filesCreated: /생성|created|wrote|파일/i.test(agentOutput),
    conventionFollowed: !/CRITICAL|심각한 위반/i.test(agentOutput),
  };

  const issues: string[] = [];
  if (!checks.noBuildError) issues.push("빌드 에러 존재");
  if (!checks.noTypeError) issues.push("타입 에러 존재");
  if (!checks.filesCreated) issues.push("파일 생성 확인 안 됨");
  if (!checks.conventionFollowed) issues.push("FE 컨벤션 심각한 위반");

  console.log(
    `  코드 평가: 빌드=${checks.noBuildError} 타입=${checks.noTypeError} 파일=${checks.filesCreated} 컨벤션=${checks.conventionFollowed}`
  );

  if (issues.length === 0) {
    return { pass: true, feedback: "", details: checks };
  }

  return {
    pass: false,
    feedback: `코드 문제 발견: ${issues.join(", ")}. 에러를 수정하세요.`,
    details: checks,
  };
}
```

**실패 케이스 예시**:
- Code Agent 출력에 `error TS2345`가 포함되면 → `pass: false`, `feedback: "빌드 에러 존재"`
- `"생성"` 같은 단어가 없으면 → `pass: false`, `feedback: "파일 생성 확인 안 됨"`

### review-eval.ts — "심각한 이슈가 없는가?"

```typescript
// evaluators/review-eval.ts — 전체 코드
export function evaluateReview(reviewOutput: string): EvalResult {
  // Review Agent의 출력에서 심각도별 이슈 개수를 카운트
  const criticalCount = (reviewOutput.match(/CRITICAL/gi) || []).length;
  const highCount = (reviewOutput.match(/HIGH/gi) || []).length;
  const mediumCount = (reviewOutput.match(/MEDIUM/gi) || []).length;

  const checks = {
    noCritical: criticalCount === 0,    // CRITICAL 0개여야 통과
    noHigh: highCount === 0,            // HIGH 0개여야 통과
    fewMedium: mediumCount <= 3,        // MEDIUM 3개 이하면 OK
  };

  console.log(
    `  리뷰 평가: CRITICAL=${criticalCount} HIGH=${highCount} MEDIUM=${mediumCount}`
  );

  const issues: string[] = [];
  if (!checks.noCritical) issues.push(`CRITICAL ${criticalCount}개`);
  if (!checks.noHigh) issues.push(`HIGH ${highCount}개`);

  if (issues.length === 0) {
    return { pass: true, feedback: "", details: checks };
  }

  return {
    pass: false,
    feedback: `리뷰 미통과: ${issues.join(", ")}. 해당 이슈를 수정하세요.`,
    details: checks,
  };
}
```

**실패 케이스 예시**:
- Review Agent가 `[CRITICAL] src/pages/.../Page.tsx:15 — useEffect에 의존성 배열 누락`을 출력하면
- → `criticalCount = 1` → `pass: false`

### 하네스가 동작하는 2가지 레벨

```
레벨 1: 서브에이전트 내부 (자체 품질 보장)
┌──────────────────────────────┐
│  Code Agent                  │
│    실행 → evaluateCode()     │
│    미달? → 자체 재시도 (최대 5회) │
│    통과? → 결과 반환           │
└──────────────────────────────┘

레벨 2: 오케스트레이터 (파이프라인 레벨)
┌──────────────────────────────┐
│  main.ts                     │
│    Code Agent 결과 받음       │
│    Review Agent 결과 받음     │
│    → 통과/미통과 + Ralph 판단 │
└──────────────────────────────┘
```

즉, **에이전트가 자체적으로 품질을 보장한 결과물**이 오케스트레이터로 올라가고,
오케스트레이터는 그 위에서 **Code↔Review 조합의 전체적인 판단**을 한다.

---

## 5. Ralph 패턴 — 자기참조 진화 루프

### "단순 루프"와 "Ralph"의 차이

```
단순 루프:
  Cycle 1: Code → Review → "컨벤션 안 맞음" → Code Agent에 그대로 전달
  Cycle 2: Code → Review → "컨벤션 안 맞음" → Code Agent에 그대로 전달
  → 같은 피드백, 같은 방식, 같은 결과

Ralph:
  Cycle 1: Code → Review → 60점
           메타 분석: "60점, 첫 시도, 방향 전환 필요"
           → Code Agent에 메타 분석 + 피드백 + 전략 지시 전달

  Cycle 2: Code → Review → 72점
           메타 분석: "60→72 개선 중, 같은 방향 심화"
           → "리뷰 지적사항만 집중 수정하세요"

  Cycle 3: Code → Review → 74점
           메타 분석: "72→74 정체 감지! 전략 근본 전환"
           → "기존 코드 버리고 구조부터 재설계하세요"

  Cycle 4: Code → Review → 91점 → 통과!
```

### Ralph의 3요소와 코드 매핑

#### 요소 1: 점수 추적 — "나 지금 나아지고 있어?"

```typescript
// main.ts:120-124
const scoreMatch = reviewResult.output.match(/(\d+)\s*[/\/]\s*100/);
const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
scoreHistory.push(score);
// scoreHistory = [60, 72, 74, 91]
// → 매 사이클의 점수를 배열로 기록해서 추이를 본다
```

#### 요소 2: 정체 감지 — "같은 삽질 반복 중인가?"

```typescript
// main.ts:137-145
if (scoreHistory.length >= STAGNATION_THRESHOLD) {  // 2회 이상 기록 있을 때
  const recent = scoreHistory.slice(-STAGNATION_THRESHOLD);  // 최근 2개
  const isStagnant = recent.every((s) => Math.abs(s - recent[0]) <= 5);
  // [72, 74] → |74-72| = 2 ≤ 5 → 정체!
  // [60, 72] → |72-60| = 12 > 5 → 정체 아님
  if (isStagnant) {
    previousStrategy = `완전히 다른 접근으로 전환. 기존 코드를 버리고 구조부터 재설계`;
  }
}
```

#### 요소 3: 메타 분석 — "왜 실패했고, 다음엔 어떻게?"

```typescript
// main.ts:147-165
// 개선 여부 판단
const scoreImproving = scoreHistory.length >= 2 &&
  score > scoreHistory[scoreHistory.length - 2];

// 메타 분석 조립 — 이게 다음 Code Agent의 프롬프트가 된다
const metaAnalysis = [
  `## 메타 분석 (Cycle ${cycle + 1})`,
  `- 현재 점수: ${score}/100`,
  `- 점수 추이: ${scoreHistory.join(" → ")}`,
  `- 이전 전략: ${previousStrategy}`,
  `- 전략 평가: ${scoreImproving ? "방향은 맞음" : "접근법 자체를 바꿔야 함"}`,
  ``,
  `## 리뷰 피드백`,
  reviewResult.output,              // Review Agent의 원본 피드백
  ``,
  `## 다음 전략 지시`,
  scoreImproving
    ? "구체적 지적사항만 집중 수정하세요."
    : "근본 원인을 분석하고 구조/설계 자체를 다르게 접근하세요.",
].join("\n");

reviewFeedback = metaAnalysis;      // ← 다음 사이클에서 Code Agent가 이걸 받는다
```

### 핵심: Ralph는 프롬프트 엔지니어링의 자동화

서브에이전트(Claude) 자체가 똑똑해지는 게 아니다.
오케스트레이터가 **프롬프트에 메타 분석을 붙여서** 같은 모델이 다른 판단을 하도록 유도하는 것.

사람이 해주는 걸 코드로 자동화한 것:
```
사람: "이전에 이렇게 했는데 안 됐으니까 다르게 해봐"
Ralph: 점수 추적 + 정체 감지 + 전략 지시를 자동 생성
```

---

## 6. 데이터 흐름 추적 — 변수별 생명주기

### 변수가 어디서 생기고, 어디로 흘러가는지

```
spec (고정)
  생성: main.ts — Spec Agent 출력 or 원본 파일
  사용: Code Agent 입력, Review Agent 입력
  변화: 없음 (한 번 결정되면 끝)

reviewFeedback (매 사이클 갱신)
  생성: main.ts — Ralph 메타 분석
  사용: Code Agent 입력 (다음 사이클)
  변화: 매 사이클마다 새로 작성

scoreHistory (누적)
  생성: main.ts — 빈 배열로 시작
  사용: 정체 감지, 개선 여부 판단
  변화: 매 사이클마다 push

previousStrategy (매 사이클 갱신)
  생성: main.ts — "스펙 기반 초기 구현"
  사용: 메타 분석 문서에 포함
  변화: 개선 중이면 심화, 정체면 전환

totalCost (누적)
  생성: main.ts — 0에서 시작
  사용: 결과 요약
  변화: 매 에이전트 호출마다 += cost

sessionId (에이전트별 고유)
  생성: 각 에이전트 내부 — SDK init 메시지에서 캡처
  사용: resume로 세션 이어서 재시도
  변화: 에이전트 내부에서만 사용, 외부로 안 나감
```

### 사이클별 데이터 스냅샷

```
Cycle 1:
  spec = "## 요구사항\n[MUST] 목록 표시..."        (고정)
  reviewFeedback = undefined                       (첫 사이클이라 없음)
  Code Agent 입력: spec만
  Review Agent 출력: "65/100 [HIGH] queryKey 비계층적..."
  scoreHistory = [65]
  previousStrategy = "전략 전환: 리뷰 실패 원인 기반 재설계"

Cycle 2:
  spec = (위와 동일)                                (고정)
  reviewFeedback = "## 메타 분석\n- 현재 점수: 65..."  (메타 분석)
  Code Agent 입력: spec + reviewFeedback
  Review Agent 출력: "78/100 [MEDIUM] 네이밍 이슈..."
  scoreHistory = [65, 78]
  previousStrategy = "전략 전환 → 피드백 반영 심화"

Cycle 3:
  spec = (위와 동일)                                (고정)
  reviewFeedback = "## 메타 분석\n- 점수 추이: 65 → 78 (개선 중)..."
  Code Agent 입력: spec + reviewFeedback
  Review Agent 출력: "리뷰 통과. 이슈 없음. 92/100"
  → 통과! 루프 탈출
```

---

## 7. 비유와 멘탈 모델

### 팀 프로젝트 비유

| 에이전트 개념 | 팀 역할 | 하는 일 |
|---|---|---|
| 오케스트레이터 (`main.ts`) | PM | 업무 분배, 결과물 연결, 일정 관리 |
| Spec Agent | 기획자 | 요구사항 → 구현 스펙 |
| Code Agent | 개발자 | 스펙 보고 코드 구현 |
| Review Agent | 시니어 개발자 | 코드 리뷰, 점수 |
| 하네스 (`evaluators/`) | QA | 체크리스트 기반 품질 검증 |
| Ralph (메타 분석) | PM의 스프린트 회고 | "왜 안 됐지? 다음엔 방향 바꾸자" |

### GPS 비유

- **오케스트레이션** = 내비게이션 경로 (A → B → C 순서)
- **하네스** = 목적지 도착 확인 ("여기가 맞나?")
- **Ralph** = 경로 재탐색 ("이 길 막혔으니 우회하세요")
- **정체 감지** = "10분째 같은 곳을 맴돌고 있습니다. 경로를 재탐색합니다."

### 시험 비유

- **단순 루프** = 틀린 문제를 같은 풀이법으로 다시 풀기
- **Ralph** = 틀린 문제를 보고 "풀이법 자체가 잘못됐나?" 반성 후 다른 접근
- **하네스** = 시험 끝나고 채점
- **오케스트레이션** = 시험 시간표 관리 (1교시 국어, 2교시 수학)

---

## 8. 한계와 트레이드오프

### Ralph의 3가지 한계

| 한계 | 설명 | 예시 |
|------|------|------|
| **점수 신뢰성** | Review Agent 점수가 일관적이지 않으면 전략 판단이 흔들림 | 같은 코드에 70점→80점→70점 줄 수 있음 |
| **비용 누적** | 사이클마다 API 호출 비용 쌓임 | 5사이클 × (sonnet + haiku) = 상당한 비용 |
| **모델 능력 한계** | 프롬프트를 바꿔도 모델 자체가 못 하는 건 못 함 | Ralph는 프롬프트 최적화 자동화이지, 모델 확장이 아님 |

### 모델 선택 트레이드오프

| 에이전트 | 모델 | 이유 | 리스크 |
|----------|------|------|--------|
| Spec Agent | sonnet | 구조화된 문서 생성 필요 | 비용 높음 |
| Code Agent | sonnet | 코드 품질 중요 | 비용 높음 |
| Review Agent | haiku | 비용 절약 | 점수 신뢰성 ↓ → Ralph 판단 흔들릴 수 있음 |

### 적용 가이드

| 상황 | 추천 패턴 |
|------|-----------|
| 에이전트 1개, 단순 작업 | 하네스만 |
| 여러 에이전트, 파이프라인 | 오케스트레이션 + 하네스 |
| 품질 중요, 비용 여유 | 오케스트레이션 + 하네스 + Ralph |
| 비용 민감, 빠른 결과 | 오케스트레이션 + 하네스 (Ralph 생략) |

---

## 부록: 타입 정의 (`types.ts`)

```typescript
/** 평가 결과 — 모든 하네스의 반환 타입 */
export interface EvalResult {
  pass: boolean;
  feedback: string;
  details?: Record<string, boolean>;
}

/** 에이전트 실행 결과 — 모든 서브에이전트의 반환 타입 */
export interface AgentResult {
  output: string;
  sessionId?: string;
  turns: number;
  cost: number;
}

/** Spec Agent 입력 */
export interface SpecInput {
  planningDoc: string;    // 기획문서 내용
  ticketId?: string;      // Linear 티켓 ID (선택)
  designInput?: string;   // 디자인 입력 (선택)
}

/** fe-auto 파이프라인 입력 */
export interface FeAutoInput {
  specPath: string;       // 스펙/기획문서 파일 경로
  projectPath: string;    // FE 프로젝트 경로
  ticketId?: string;      // Linear 티켓 ID (선택)
  convertSpec?: boolean;  // true면 Spec Agent 경유
  reviewer?: "claude" | "openai" | "both";  // 리뷰어 선택
}

/** 파이프라인 상태 — 오케스트레이터가 관리 */
export interface PipelineState {
  input: FeAutoInput;
  spec: string;            // 한 번 결정되면 고정
  reviewResult?: string;
}
```

---

## 9. 멀티 모델 오케스트레이션 — Claude + OpenAI 병렬 리뷰

### 에이전틱 관점에서 왜 중요한가

실제 AI 에이전트 시스템에서 **모든 작업에 같은 모델을 쓸 이유가 없다**.
모델마다 강점이 다르고, 비용도 다르고, 관점도 다르다.

```
단일 모델 에이전트:
  모든 서브에이전트가 같은 모델 사용
  → 같은 편향, 같은 강점, 같은 약점

멀티 모델 에이전트:
  서브에이전트마다 최적의 모델 선택
  → 다양한 관점, 상호 보완, 비용 최적화
```

이건 사람 팀에서 "리뷰어를 다양하게 두는 것"과 같다.
시니어 A가 놓치는 걸 시니어 B가 잡고, 그 반대도 마찬가지.

### SDK별 에이전트의 현실

**핵심 발견**: Claude Agent SDK와 OpenAI Codex SDK는 **놀랍도록 유사한 구조**다.

```
Claude Agent SDK → query()                    → Claude Code CLI 서브프로세스 → Claude 모델
Codex SDK        → Codex.startThread().run()   → Codex CLI 서브프로세스      → OpenAI 모델
```

둘 다 CLI 도구를 서브프로세스로 실행하고, **구독 기반 인증**을 사용한다 (API 키 불요).
각 SDK는 자기 모델만 지원하므로, 멀티 모델 에이전트를 만들려면 **오케스트레이터가 서로 다른 SDK를 호출**해야 한다.
이것이 에이전틱 시스템에서 오케스트레이터의 진짜 역할이다 — 단순 순서 관리가 아니라, **이종 시스템을 통합**하는 것.

### 구현: Claude vs OpenAI 리뷰 에이전트 비교

#### 같은 인터페이스, 다른 내부

두 리뷰 에이전트 모두 동일한 `AgentResult`를 반환한다.
오케스트레이터 입장에서는 **누가 리뷰했는지 모르고, 결과만 받는다**.

```typescript
// 오케스트레이터는 이것만 안다
interface AgentResult {
  output: string;       // 리뷰 결과 텍스트
  sessionId?: string;   // 세션 (있으면)
  turns: number;        // 대화 턴 수
  cost: number;         // 비용
}

// Claude든 OpenAI든 같은 타입으로 반환
async function executeReview(reviewer, ...): Promise<AgentResult> {
  if (reviewer === "claude") return runReviewAgent(...);
  if (reviewer === "openai") return runReviewAgentOpenAI(...);
  // both: 병렬 실행
}
```

이게 에이전틱의 핵심 원칙 — **인터페이스 통일, 구현 교체 가능**.

#### Claude 리뷰 에이전트의 동작 방식

```typescript
// agents/review-agent.ts — Claude Agent SDK
for await (const message of query({
  prompt: buildReviewPrompt(...),
  options: {
    model: "haiku",
    systemPrompt: REVIEW_SYSTEM_PROMPT,
    plugins: [FE_WORKFLOW_PLUGIN],          // ← 플러그인이 컨벤션 자동 주입
    permissionMode: "bypassPermissions",
    ...(isFirst ? {} : { resume: sessionId }), // ← 세션으로 대화 이어가기
  },
})) { ... }
```

**특징**:
- Claude Code CLI를 서브프로세스로 실행
- **파일 시스템 도구 사용 가능** — 프로젝트의 실제 파일을 직접 읽을 수 있음
- **플러그인으로 컨벤션 주입** — fe-workflow 플러그인이 시스템에 FE 규칙을 넣어줌
- **세션 유지** — `resume: sessionId`로 이전 대화 이어서 재리뷰 가능

#### Codex 리뷰 에이전트의 동작 방식

```typescript
// agents/review-agent-openai.ts — OpenAI Codex SDK
const codex = new Codex();                 // ChatGPT 구독 인증 자동 사용
const conventions = loadConventions();     // ← 컨벤션을 직접 파일에서 읽어야 함

const thread = codex.startThread({
  sandboxMode: "read-only",
  approvalPolicy: "never",
});

const turn = await thread.run(
  buildReviewPrompt(conventions, ...)      // ← 프롬프트에 컨벤션 직접 포함
);

lastResult = turn.finalResponse;           // 결과 텍스트
totalTokens += turn.usage?.input_tokens;   // 토큰 사용량

// 재시도 시 스레드 이어서
const retryThread = codex.resumeThread(thread.id!, ...);
```

**특징**:
- Codex CLI를 서브프로세스로 실행 (Claude Agent SDK와 동일한 패턴!)
- **구독 기반 인증** — ChatGPT Plus/Pro 구독으로 동작, API 키 불요
- **스레드로 세션 유지** — `resumeThread(id)`로 대화 이어가기 (Claude의 `resume`와 동일)
- **컨벤션을 프롬프트에 직접 포함** — 플러그인 시스템이 없으니 파일을 읽어서 넣어줌

### 두 SDK의 구조 비교

두 SDK가 놀랍도록 유사하다는 것 자체가 중요한 학습 포인트다.

| | Claude Agent SDK | OpenAI Codex SDK |
|---|---|---|
| **패키지** | `@anthropic-ai/claude-agent-sdk` | `@openai/codex-sdk` |
| **실행 방식** | `query()` → Claude Code CLI | `Codex.startThread().run()` → Codex CLI |
| **인증** | Claude Code 구독 (Pro/Max) | ChatGPT 구독 (Plus/Pro) |
| **세션** | `resume: sessionId` | `resumeThread(threadId)` |
| **플러그인** | `plugins: [...]` 지원 | 없음 (프롬프트에 직접 포함) |
| **도구** | 파일 시스템, 웹 등 자동 제공 | 샌드박스 내 명령 실행 |
| **비용** | 구독에 포함 | 구독에 포함 |

**에이전틱 시사점**:
- 두 SDK 모두 **CLI 도구를 서브프로세스로 실행**하는 같은 아키텍처
- 차이점은 **플러그인/도구 생태계** — Claude는 플러그인으로 컨벤션 자동 주입, Codex는 수동
- 실제 시스템에서는 **작업 특성에 따라 SDK를 선택**한다

### both 모드: 병렬 실행과 다관점 리뷰

```typescript
// main.ts — both 모드
const [claudeResult, openaiResult] = await Promise.all([
  runReviewAgent(projectPath, spec, codeOutput),        // Claude 리뷰
  runReviewAgentOpenAI(projectPath, spec, codeOutput),  // OpenAI 리뷰 (동시 실행)
]);

// 두 결과를 합쳐서 Code Agent에 전달
return {
  output: `## Claude 리뷰\n${claudeResult.output}\n\n## OpenAI 리뷰\n${openaiResult.output}`,
  cost: claudeResult.cost + openaiResult.cost,
};
```

**에이전틱 패턴**: 다관점 검증 (Multi-Perspective Verification)
- 같은 코드를 서로 다른 모델이 리뷰
- Claude는 도구를 써서 실제 파일 구조까지 보고 리뷰
- OpenAI는 프롬프트에 포함된 정보만으로 리뷰
- 둘의 관점이 다르기 때문에 **한쪽이 놓친 이슈를 다른 쪽이 잡을 수 있음**

이걸 Ralph 루프와 결합하면:
```
Cycle 1: Code Agent → [Claude 리뷰 + OpenAI 리뷰] → 두 리뷰 모두 반영한 메타 분석
Cycle 2: Code Agent (두 관점의 피드백 반영) → [Claude + OpenAI] → ...
```

**단일 모델 리뷰 대비 장점**:
- 관점 다양성 → 이슈 커버리지 ↑
- 모델 편향 상쇄 → 점수 신뢰성 ↑ (Ralph의 약점 보완)

**단점**:
- 비용 2배
- 두 리뷰가 충돌할 수 있음 (Claude는 통과, OpenAI는 미통과)

### 확장 가능성

이 패턴은 리뷰뿐 아니라 어디든 적용 가능하다:

```
오케스트레이터
  ├── Spec Agent     → Claude (구조화된 문서 생성에 강함)
  ├── Code Agent     → Claude Code (파일 시스템 접근 필요)
  ├── Review Agent   → OpenAI o3 (추론 능력 활용)
  ├── Security Agent → Claude (보안 분석)
  └── Test Agent     → OpenAI Codex (테스트 코드 생성)
```

각 에이전트에 가장 적합한 모델을 매칭하는 것 — 이게 멀티 모델 오케스트레이션의 본질이다.
