# dual-review 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Claude Code(Opus)가 FE 코드를 설계+구현하고, Codex SDK가 코드리뷰하는 멀티 AI 파이프라인 서비스 구축

**Architecture:** Claude Agent SDK로 Design Agent(설계)와 Impl Agent(구현)를 구동하고, OpenAI Codex SDK로 Review Agent(리뷰)를 구동. 리뷰 피드백 루프로 자동 수정 후 사용자 최종 확인.

**Tech Stack:** TypeScript (ESM, strict), @anthropic-ai/claude-agent-sdk, @openai/codex-sdk, pnpm workspace

**Design Doc:** `docs/plans/2026-03-04-dual-review-design.md`

**Reference:** `services/fe-auto/` — 동일 모노레포의 기존 에이전트 서비스. 평가 루프, 세션 관리, 플러그인 패턴 참조.

---

### Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `services/dual-review/package.json`
- Create: `services/dual-review/tsconfig.json`
- Create: `services/dual-review/types.ts`
- Modify: `package.json` (루트 — scripts 추가)

**Step 1: 디렉토리 구조 생성**

```bash
mkdir -p services/dual-review/agents services/dual-review/evaluators
```

**Step 2: package.json 생성**

Create `services/dual-review/package.json`:

```json
{
  "name": "dual-review",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx main.ts"
  },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.1",
    "@openai/codex-sdk": "latest"
  }
}
```

**Step 3: tsconfig.json 생성**

Create `services/dual-review/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["**/*.ts"]
}
```

**Step 4: types.ts 생성**

Create `services/dual-review/types.ts`:

```typescript
/** 평가 결과 */
export interface EvalResult {
  pass: boolean;
  feedback: string;
  details?: Record<string, boolean>;
}

/** 에이전트 실행 결과 (Claude Agent SDK) */
export interface AgentResult {
  output: string;
  sessionId?: string;
  turns: number;
  cost: number;
}

/** dual-review 파이프라인 입력 */
export interface DualReviewInput {
  /** 요구사항 (자연어) */
  requirement: string;
  /** 대상 FE 프로젝트 경로 */
  targetProject: string;
}

/** 파이프라인 상태 */
export interface PipelineState {
  input: DualReviewInput;
  designSpec?: string;
  implResult?: string;
  reviewResult?: string;
}

/** Codex 리뷰 이슈 */
export interface ReviewIssue {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

/** Codex 리뷰 결과 (파싱된) */
export interface ReviewResult {
  issues: ReviewIssue[];
  summary: string;
  pass: boolean;
}
```

**Step 5: 루트 package.json에 스크립트 추가**

Modify `package.json` (루트):
- scripts에 추가: `"dual-review": "unset CLAUDECODE && pnpm --filter dual-review run dev --"`

**Step 6: 의존성 설치**

```bash
pnpm install
```

Expected: `@openai/codex-sdk`와 `@anthropic-ai/claude-agent-sdk`가 `services/dual-review/node_modules`에 설치됨

**Step 7: 타입 체크**

```bash
cd services/dual-review && npx tsc --noEmit
```

Expected: 에러 없음

**Step 8: 커밋**

```bash
git add services/dual-review/ package.json pnpm-lock.yaml
git commit -m "feat: dual-review 서비스 스캐폴딩"
```

---

### Task 2: conventions.ts — 공통 설정

**Files:**
- Create: `services/dual-review/conventions.ts`

**Step 1: conventions.ts 작성**

Create `services/dual-review/conventions.ts`:

```typescript
import { resolve } from "path";
import { homedir } from "os";

/** fe-workflow 플러그인 경로 (Claude Agent SDK query()에 전달) */
export const FE_WORKFLOW_PLUGIN = {
  type: "local" as const,
  path: resolve(homedir(), "dev/ai-ax/fe-workflow"),
};
```

> fe-auto/conventions.ts의 패턴을 그대로 따름. `loadSpec`은 dual-review에서 불필요 (파일이 아닌 자연어 입력).

**Step 2: 타입 체크**

```bash
cd services/dual-review && npx tsc --noEmit
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add services/dual-review/conventions.ts
git commit -m "feat: dual-review conventions (fe-workflow 플러그인 설정)"
```

---

### Task 3: Design Agent — Claude Opus 설계

**Files:**
- Create: `services/dual-review/agents/design-agent.ts`

**참조:** `services/fe-auto/agents/code-agent.ts` — query() 호출, 세션 관리, 평가 루프 패턴

**Step 1: design-agent.ts 작성**

Create `services/dual-review/agents/design-agent.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { FE_WORKFLOW_PLUGIN } from "../conventions.js";
import type { AgentResult, DualReviewInput } from "../types.js";

const MAX_RETRIES = 2;

export async function runDesignAgent(
  input: DualReviewInput
): Promise<AgentResult> {
  console.log("\n[Design Agent] 설계 시작\n");

  let sessionId: string | undefined;
  let lastResult = "";
  let turns = 0;
  let cost = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      isFirst
        ? "  컨벤션 기반 설계 중..."
        : `  설계 보완 중 (${attempt}/${MAX_RETRIES})...`
    );

    for await (const message of query({
      prompt: isFirst
        ? buildDesignPrompt(input)
        : `설계가 불충분합니다. 보완해주세요:\n\n${lastResult}`,
      options: {
        model: "opus" as const,
        permissionMode: "bypassPermissions" as const,
        allowDangerouslySkipPermissions: true,
        systemPrompt: buildDesignSystemPrompt(input.targetProject),
        plugins: [FE_WORKFLOW_PLUGIN],
        ...(isFirst ? {} : { resume: sessionId }),
      },
    })) {
      const msg = message as any;

      if (msg.type === "system" && msg.subtype === "init" && !sessionId) {
        sessionId = msg.session_id;
      }

      if (msg.type === "assistant") {
        const toolUses = msg.message?.content?.filter(
          (c: any) => c.type === "tool_use"
        );
        if (toolUses?.length) {
          for (const t of toolUses) {
            console.log(`    도구: ${t.name}`);
          }
        }
      }

      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        turns = msg.num_turns ?? 0;
        cost = msg.total_cost_usd ?? 0;
        console.log(`    턴: ${turns} | 비용: $${cost}`);
      }
    }

    // 설계 산출물에 핵심 섹션이 있는지 간단 검증
    const hasComponents = /컴포넌트|component/i.test(lastResult);
    const hasFiles = /파일|file|폴더|directory/i.test(lastResult);
    const hasInstructions = /구현|implement|지시|instruction/i.test(lastResult);

    if (hasComponents && hasFiles && hasInstructions) {
      console.log("  설계 완료!\n");
      return { output: lastResult, sessionId, turns, cost };
    }

    if (attempt < MAX_RETRIES) {
      console.log("  설계 산출물 불충분, 보완 요청...\n");
    }
  }

  console.log("  최대 재시도 도달. 현재 결과로 진행.\n");
  return { output: lastResult, sessionId, turns, cost };
}

function buildDesignPrompt(input: DualReviewInput): string {
  return `아래 요구사항에 대해 ${input.targetProject} 프로젝트의 FE 설계를 해주세요.

## 요구사항
${input.requirement}

## 작업 순서
1. 대상 프로젝트(${input.targetProject})의 기존 구조 탐색
2. 유사한 기존 기능/페이지 패턴 파악
3. 시스템에 주입된 FE 컨벤션 확인
4. 컴포넌트 분해 & 파일 구조 설계
5. 타입/인터페이스 정의
6. 구현 에이전트가 따를 수 있는 상세 구현 지시사항 작성

## 출력 형식
아래 섹션을 모두 포함해주세요:

### 1. 컴포넌트 구조
- 생성할 컴포넌트 목록과 역할

### 2. 파일 구조
- 생성/수정할 파일 경로와 각 파일의 역할

### 3. 타입/인터페이스
- 필요한 타입 정의 (코드 블록)

### 4. 구현 지시사항
- 구현 순서
- 각 파일에서 해야 할 작업
- 컨벤션 준수 사항 (구체적으로)
- 주의사항

## 주의사항
- 기존 프로젝트 패턴을 반드시 따르세요
- 이른 추상화 금지 — Page First 원칙
- 스펙에 없는 것은 설계하지 마세요`;
}

function buildDesignSystemPrompt(targetProject: string): string {
  return `당신은 사내 FE 프로젝트의 설계 전문가입니다.

## 역할
요구사항을 받아 FE 프로젝트(${targetProject})에 맞는 설계 산출물을 작성합니다.
구현 에이전트가 이 산출물만 보고 코드를 생성할 수 있을 정도로 상세해야 합니다.

## 핵심 원칙
- 기존 프로젝트의 패턴을 먼저 파악하고 따르세요
- 시스템에 주입된 FE 컨벤션을 반드시 준수하세요
- YAGNI — 요구사항에 없는 것은 설계하지 마세요
- 컴포넌트, 파일 구조, 타입, 구현 지시를 모두 포함하세요`;
}
```

**Step 2: 타입 체크**

```bash
cd services/dual-review && npx tsc --noEmit
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add services/dual-review/agents/design-agent.ts
git commit -m "feat: Design Agent — Claude Opus 기반 FE 설계"
```

---

### Task 4: Impl Agent — Claude Opus/Sonnet 구현

**Files:**
- Create: `services/dual-review/agents/impl-agent.ts`

**참조:** `services/fe-auto/agents/code-agent.ts` — 동일한 평가 루프 패턴

**Step 1: impl-agent.ts 작성**

Create `services/dual-review/agents/impl-agent.ts`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { FE_WORKFLOW_PLUGIN } from "../conventions.js";
import type { AgentResult, DualReviewInput } from "../types.js";

const MAX_RETRIES = 3;

export async function runImplAgent(
  input: DualReviewInput,
  designSpec: string,
  reviewFeedback?: string
): Promise<AgentResult> {
  console.log("\n[Impl Agent] 구현 시작\n");

  let sessionId: string | undefined;
  let lastResult = "";
  let turns = 0;
  let cost = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      isFirst
        ? "  설계 기반 코드 생성 중..."
        : `  수정 중 (${attempt}/${MAX_RETRIES})...`
    );

    for await (const message of query({
      prompt: isFirst
        ? buildImplPrompt(input, designSpec, reviewFeedback)
        : lastResult,
      options: {
        model: "sonnet" as const,
        permissionMode: "bypassPermissions" as const,
        allowDangerouslySkipPermissions: true,
        systemPrompt: buildImplSystemPrompt(input.targetProject),
        plugins: [FE_WORKFLOW_PLUGIN],
        ...(isFirst ? {} : { resume: sessionId }),
      },
    })) {
      const msg = message as any;

      if (msg.type === "system" && msg.subtype === "init" && !sessionId) {
        sessionId = msg.session_id;
      }

      if (msg.type === "assistant") {
        const toolUses = msg.message?.content?.filter(
          (c: any) => c.type === "tool_use"
        );
        if (toolUses?.length) {
          for (const t of toolUses) {
            console.log(`    도구: ${t.name}`);
          }
        }
      }

      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        turns = msg.num_turns ?? 0;
        cost = msg.total_cost_usd ?? 0;
        console.log(`    턴: ${turns} | 비용: $${cost}`);
      }
    }

    // 빌드/타입 에러 검증
    const hasBuildError = /error TS\d+|build failed|compilation error/i.test(lastResult);
    const hasTypeError = /type.*error|cannot find.*module|is not assignable/i.test(lastResult);
    const filesCreated = /생성|created|wrote|파일/i.test(lastResult);

    if (!hasBuildError && !hasTypeError && filesCreated) {
      console.log("  구현 완료!\n");
      return { output: lastResult, sessionId, turns, cost };
    }

    if (attempt < MAX_RETRIES) {
      const issues: string[] = [];
      if (hasBuildError) issues.push("빌드 에러");
      if (hasTypeError) issues.push("타입 에러");
      if (!filesCreated) issues.push("파일 생성 미확인");
      console.log(`  문제: ${issues.join(", ")}. 수정 요청...\n`);
      lastResult = `코드에 문제가 있습니다: ${issues.join(", ")}. 에러를 수정하세요.`;
    }
  }

  console.log("  최대 재시도 도달.\n");
  return { output: lastResult, sessionId, turns, cost };
}

function buildImplPrompt(
  input: DualReviewInput,
  designSpec: string,
  reviewFeedback?: string
): string {
  let prompt = `아래 설계에 따라 ${input.targetProject}에 FE 코드를 구현하세요.

## 원본 요구사항
${input.requirement}

## 설계 산출물 (Design Agent가 작성)
${designSpec}

## 작업 순서
1. 설계의 파일 구조대로 파일 생성
2. 타입/인터페이스 정의부터
3. API 레이어 (remotes → queries → mutations)
4. 컴포넌트 구현
5. tsc --noEmit 으로 타입 체크
6. 결과 보고 (생성/수정 파일 목록, 에러 여부)

## 주의사항
- 설계 산출물의 구현 지시사항을 정확히 따르세요
- 설계에 명시된 컨벤션 준수 사항을 반드시 지키세요
- 설계에 없는 것은 구현하지 마세요`;

  if (reviewFeedback) {
    prompt += `\n\n## Codex 리뷰 피드백 (반드시 반영)
${reviewFeedback}`;
  }

  return prompt;
}

function buildImplSystemPrompt(targetProject: string): string {
  return `당신은 사내 FE 프로젝트의 코드를 구현하는 전문가입니다.

## 역할
Design Agent의 설계 산출물을 받아 ${targetProject}에 실제 코드를 구현합니다.

## 핵심 원칙
- 설계 산출물을 정확히 따르세요 (임의 변경 금지)
- 기존 프로젝트의 패턴을 참고하세요
- 시스템에 주입된 FE 컨벤션을 준수하세요
- 구현 후 반드시 tsc --noEmit 실행

## 작업 완료 후
- 생성/수정한 파일 목록 보고
- 에러가 있으면 직접 수정
- git diff 내용 보고`;
}
```

**Step 2: 타입 체크**

```bash
cd services/dual-review && npx tsc --noEmit
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add services/dual-review/agents/impl-agent.ts
git commit -m "feat: Impl Agent — Claude Sonnet 기반 FE 코드 구현"
```

---

### Task 5: Review Agent — Codex SDK 코드 리뷰

**Files:**
- Create: `services/dual-review/agents/review-agent.ts`

**핵심:** 이 에이전트만 Codex SDK를 사용. Claude Agent SDK가 아닌 `@openai/codex-sdk`로 호출.

**Step 1: review-agent.ts 작성**

Create `services/dual-review/agents/review-agent.ts`:

```typescript
import { Codex } from "@openai/codex-sdk";
import type { ReviewResult, ReviewIssue } from "../types.js";

export async function runReviewAgent(
  targetProject: string,
  designSpec: string,
  implOutput: string
): Promise<{ result: ReviewResult; cost: number }> {
  console.log("\n[Review Agent] Codex 코드 리뷰 시작\n");

  const apiKey = process.env.CODEX_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CODEX_API_KEY 환경변수가 설정되지 않았습니다.\n" +
      "export CODEX_API_KEY=<your-openai-api-key>"
    );
  }

  const codex = new Codex({ apiKey });
  const thread = codex.startThread();

  const reviewPrompt = buildReviewPrompt(targetProject, designSpec, implOutput);

  console.log("  Codex에 리뷰 요청 중...");
  const response = await thread.run(reviewPrompt);
  const reviewText = typeof response === "string" ? response : String(response);
  console.log("  Codex 리뷰 완료\n");

  // 리뷰 결과 파싱
  const result = parseReviewResult(reviewText);

  console.log(`  이슈: CRITICAL=${result.issues.filter(i => i.severity === "CRITICAL").length} HIGH=${result.issues.filter(i => i.severity === "HIGH").length} MEDIUM=${result.issues.filter(i => i.severity === "MEDIUM").length} LOW=${result.issues.filter(i => i.severity === "LOW").length}`);

  return { result, cost: 0 };
}

function buildReviewPrompt(
  targetProject: string,
  designSpec: string,
  implOutput: string
): string {
  return `${targetProject} 프로젝트에 생성된 FE 코드를 리뷰하세요.

## 설계 산출물
${designSpec}

## 구현 결과
${implOutput}

## 리뷰 기준
1. 코드 품질 (가독성, 유지보수성)
2. 버그/로직 오류
3. 보안 이슈
4. FE 컨벤션 준수 여부
5. 타입 안전성
6. 설계 산출물과의 일치도

## 출력 형식 (반드시 이 형식으로)
각 이슈를 아래 형식으로:
- [CRITICAL] {파일}:{라인} — {설명} | 제안: {수정 제안}
- [HIGH] {파일}:{라인} — {설명} | 제안: {수정 제안}
- [MEDIUM] {파일} — {설명}
- [LOW] {파일} — {설명}

이슈가 없으면 "리뷰 통과. 이슈 없음." 출력.

마지막에 한 줄 요약을 작성하세요.`;
}

/** Codex 리뷰 텍스트를 구조화된 ReviewResult로 파싱 */
function parseReviewResult(reviewText: string): ReviewResult {
  const issues: ReviewIssue[] = [];

  // [SEVERITY] file:line — message | 제안: suggestion 패턴 매칭
  const issuePattern = /\[(\w+)\]\s+([^—\n]+?)(?::(\d+))?\s*—\s*([^|\n]+)(?:\|\s*제안:\s*(.+))?/g;
  let match;

  while ((match = issuePattern.exec(reviewText)) !== null) {
    const severity = match[1].toUpperCase();
    if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(severity)) {
      issues.push({
        severity: severity as ReviewIssue["severity"],
        file: match[2].trim(),
        line: match[3] ? parseInt(match[3]) : undefined,
        message: match[4].trim(),
        suggestion: match[5]?.trim(),
      });
    }
  }

  const hasCriticalOrHigh = issues.some(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  );

  // 요약 추출 (마지막 문단)
  const lines = reviewText.trim().split("\n");
  const summary = lines[lines.length - 1] || "리뷰 완료";

  return {
    issues,
    summary,
    pass: !hasCriticalOrHigh,
  };
}
```

> **주의:** `@openai/codex-sdk`의 실제 API가 위와 다를 수 있음. 설치 후 타입 확인하여 조정 필요. `Codex` 클래스와 `startThread()` → `run()` 패턴은 공식 문서 기반이나, SDK 버전에 따라 import 경로나 메서드 시그니처가 다를 수 있음.

**Step 2: 타입 체크**

```bash
cd services/dual-review && npx tsc --noEmit
```

Expected: 에러 가능 — `@openai/codex-sdk`의 실제 타입에 맞춰 조정

**Step 3: Codex SDK 실제 타입 확인 후 조정**

```bash
ls services/dual-review/node_modules/@openai/codex-sdk/
```

SDK의 실제 export를 확인하고 import/호출을 조정.

**Step 4: 커밋**

```bash
git add services/dual-review/agents/review-agent.ts
git commit -m "feat: Review Agent — Codex SDK 기반 코드 리뷰"
```

---

### Task 6: Review Evaluator — 리뷰 결과 판정

**Files:**
- Create: `services/dual-review/evaluators/review-eval.ts`

**Step 1: review-eval.ts 작성**

Create `services/dual-review/evaluators/review-eval.ts`:

```typescript
import type { EvalResult, ReviewResult } from "../types.js";

/** ReviewResult를 EvalResult로 변환 — 파이프라인 루프용 */
export function evaluateReview(review: ReviewResult): EvalResult {
  const criticalCount = review.issues.filter(i => i.severity === "CRITICAL").length;
  const highCount = review.issues.filter(i => i.severity === "HIGH").length;
  const mediumCount = review.issues.filter(i => i.severity === "MEDIUM").length;

  console.log(
    `  리뷰 평가: CRITICAL=${criticalCount} HIGH=${highCount} MEDIUM=${mediumCount}`
  );

  const checks = {
    noCritical: criticalCount === 0,
    noHigh: highCount === 0,
    fewMedium: mediumCount <= 3,
  };

  if (checks.noCritical && checks.noHigh) {
    return { pass: true, feedback: "", details: checks };
  }

  // 피드백: CRITICAL/HIGH 이슈만 수정 대상으로 전달
  const actionableIssues = review.issues
    .filter(i => i.severity === "CRITICAL" || i.severity === "HIGH")
    .map(i => {
      let line = `- [${i.severity}] ${i.file}${i.line ? `:${i.line}` : ""} — ${i.message}`;
      if (i.suggestion) line += `\n  제안: ${i.suggestion}`;
      return line;
    })
    .join("\n");

  return {
    pass: false,
    feedback: `Codex 리뷰에서 ${criticalCount + highCount}개 이슈 발견:\n\n${actionableIssues}`,
    details: checks,
  };
}
```

**Step 2: 타입 체크**

```bash
cd services/dual-review && npx tsc --noEmit
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add services/dual-review/evaluators/review-eval.ts
git commit -m "feat: Review Evaluator — CRITICAL/HIGH 기반 판정"
```

---

### Task 7: Orchestrator — main.ts

**Files:**
- Create: `services/dual-review/main.ts`

**참조:** `services/fe-auto/main.ts` — CLI 파싱, 파이프라인 루프 패턴

**Step 1: main.ts 작성**

Create `services/dual-review/main.ts`:

```typescript
import { runDesignAgent } from "./agents/design-agent.js";
import { runImplAgent } from "./agents/impl-agent.js";
import { runReviewAgent } from "./agents/review-agent.js";
import { evaluateReview } from "./evaluators/review-eval.js";
import type { DualReviewInput, PipelineState } from "./types.js";

const MAX_REVIEW_CYCLES = 2;

// ──────────────────────────────────────────────
// CLI 입력 파싱
// ──────────────────────────────────────────────
function parseArgs(): DualReviewInput {
  const args = process.argv.slice(2);
  const requirement = args[0];

  if (!requirement) {
    console.error("사용법:");
    console.error('  pnpm dual-review "요구사항" --target <프로젝트경로>');
    console.error("");
    console.error("예시:");
    console.error('  pnpm dual-review "로그인 페이지에 소셜 로그인 추가" --target ~/work/ishopcare-frontend');
    process.exit(1);
  }

  const targetIdx = args.indexOf("--target");
  const targetProject = targetIdx !== -1 && args[targetIdx + 1]
    ? args[targetIdx + 1]
    : "~/work/ishopcare-frontend";

  return { requirement, targetProject };
}

// ──────────────────────────────────────────────
// 오케스트레이터
// ──────────────────────────────────────────────
async function main() {
  const input = parseArgs();
  let totalCost = 0;

  console.log("═".repeat(50));
  console.log("dual-review 시작");
  console.log(`요구사항: ${input.requirement}`);
  console.log(`대상 프로젝트: ${input.targetProject}`);
  console.log("═".repeat(50));

  const state: PipelineState = { input };

  // ── Step 1: Design Agent (Claude Opus) ──
  console.log("\n[Pipeline] Step 1: 설계");
  const designResult = await runDesignAgent(input);
  state.designSpec = designResult.output;
  totalCost += designResult.cost;

  // ── Step 2: Impl ↔ Review 루프 ──
  console.log("\n[Pipeline] Step 2: 구현 → 리뷰 루프");

  let reviewPassed = false;
  let reviewFeedback: string | undefined;

  for (let cycle = 0; cycle < MAX_REVIEW_CYCLES; cycle++) {
    console.log(`\n--- Cycle ${cycle + 1}/${MAX_REVIEW_CYCLES} ---`);

    // Impl Agent
    const implResult = await runImplAgent(
      input,
      state.designSpec!,
      reviewFeedback
    );
    state.implResult = implResult.output;
    totalCost += implResult.cost;

    // Review Agent (Codex SDK)
    const { result: reviewResult, cost: reviewCost } = await runReviewAgent(
      input.targetProject,
      state.designSpec!,
      implResult.output
    );
    totalCost += reviewCost;

    // 평가
    const evaluation = evaluateReview(reviewResult);

    if (evaluation.pass) {
      reviewPassed = true;
      state.reviewResult = reviewResult.summary;

      // 사용자 최종 확인
      console.log("\n[Pipeline] 리뷰 통과! 사용자 확인 대기...");
      console.log("\n리뷰 요약:");
      console.log(reviewResult.summary);

      if (reviewResult.issues.length > 0) {
        console.log("\n남은 이슈 (MEDIUM/LOW):");
        for (const issue of reviewResult.issues) {
          console.log(`  - [${issue.severity}] ${issue.file} — ${issue.message}`);
        }
      }
      break;
    }

    reviewFeedback = evaluation.feedback;
    console.log(
      `Cycle ${cycle + 1} 리뷰 미통과. ${
        cycle + 1 < MAX_REVIEW_CYCLES ? "재시도..." : "최대 사이클 도달."
      }`
    );
  }

  // ── 결과 요약 ──
  console.log("\n" + "═".repeat(50));
  console.log("결과 요약");
  console.log("═".repeat(50));
  console.log(`요구사항: ${input.requirement}`);
  console.log(`대상 프로젝트: ${input.targetProject}`);
  console.log(`총 비용: $${totalCost.toFixed(4)}`);
  console.log(`리뷰: ${reviewPassed ? "통과" : "이슈 있음 (수동 확인 필요)"}`);

  if (!reviewPassed) {
    console.log("\n최대 리뷰 사이클 도달. 남은 이슈를 확인하세요.");
    console.log("마지막 피드백:");
    console.log(reviewFeedback);
  }
}

main().catch((err) => {
  console.error("에러:", err.message);
  process.exit(1);
});
```

**Step 2: 타입 체크**

```bash
cd services/dual-review && npx tsc --noEmit
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add services/dual-review/main.ts
git commit -m "feat: dual-review Orchestrator — Design → Impl → Review 파이프라인"
```

---

### Task 8: 통합 테스트 (Smoke Test)

**Step 1: CODEX_API_KEY 확인**

```bash
echo $CODEX_API_KEY
```

없으면 설정:

```bash
export CODEX_API_KEY=<your-key>
```

**Step 2: 타입 체크 (전체)**

```bash
cd services/dual-review && npx tsc --noEmit
```

Expected: 에러 없음

**Step 3: Codex SDK 실제 API 확인**

Codex SDK의 export를 확인하고 review-agent.ts를 실제 API에 맞게 조정:

```bash
node -e "const pkg = await import('@openai/codex-sdk'); console.log(Object.keys(pkg))"
```

조정이 필요하면 review-agent.ts 수정 후 다시 타입 체크.

**Step 4: dry-run (짧은 요구사항으로 테스트)**

```bash
pnpm dual-review "버튼 컴포넌트에 loading 상태 추가" --target ~/work/ishopcare-frontend
```

Expected:
1. Design Agent가 설계 산출물 출력
2. Impl Agent가 코드 생성
3. Review Agent(Codex)가 리뷰 수행
4. 결과 요약 출력

**Step 5: 에러 대응**

- Codex SDK 연결 실패 → API 키 확인, 네트워크 확인
- Claude Agent SDK 에러 → `unset CLAUDECODE` 확인
- 타입 에러 → SDK 실제 타입에 맞게 조정

**Step 6: 최종 커밋**

```bash
git add -A services/dual-review/
git commit -m "feat: dual-review 통합 완료 — Claude Opus + Codex SDK 파이프라인"
```

---

## 의존 관계

```
Task 1 (스캐폴딩)
  ├→ Task 2 (conventions)
  │    ├→ Task 3 (Design Agent)
  │    └→ Task 4 (Impl Agent)
  ├→ Task 5 (Review Agent) — Codex SDK, Task 1 이후 가능
  └→ Task 6 (Review Evaluator) — Task 1 이후 가능

Task 3 + Task 4 + Task 5 + Task 6
  └→ Task 7 (Orchestrator)
      └→ Task 8 (Smoke Test)
```

> Task 3~6은 서로 독립적이므로 **병렬 실행 가능**.
