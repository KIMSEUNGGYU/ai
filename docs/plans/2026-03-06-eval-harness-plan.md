# Eval Harness 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** fe-auto 에이전트의 품질을 체계적으로 측정하는 eval harness를 직접 구축한다 (학습 + 회귀 방지).

**Architecture:** `packages/eval`에 공유 프레임워크(타입, 러너, 스코러, 리포터)를 만들고, `services/fe-auto/evals/`에서 이를 사용하여 spec-agent와 code-agent를 평가한다. 실제 LLM API를 호출하는 live eval 방식.

**Tech Stack:** TypeScript (ESM), Claude Agent SDK (`query()`), tsx (런타임), pnpm workspace

---

### Task 1: packages/eval 패키지 스캐폴딩

**Files:**
- Create: `packages/eval/package.json`
- Create: `packages/eval/tsconfig.json`
- Create: `packages/eval/src/types.ts`

**Step 1: package.json 생성**

```json
{
  "name": "@agents/eval",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "dependencies": {}
}
```

**Step 2: tsconfig.json 생성**

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

**Step 3: 코어 타입 작성**

`packages/eval/src/types.ts`:

```typescript
/** 개별 eval 케이스 */
export interface EvalCase<TInput = string, TExpected = unknown> {
  id: string;
  name: string;
  input: TInput;
  expected: TExpected;
  tags?: string[];
}

/** eval 케이스 모음 */
export interface EvalDataset<TInput = string, TExpected = unknown> {
  name: string;
  cases: EvalCase<TInput, TExpected>[];
}

/** 개별 scorer 결과 */
export interface ScoreResult {
  score: number; // 0.0 ~ 1.0
  pass: boolean;
  reason?: string;
}

/** 단일 케이스의 전체 eval 결과 */
export interface CaseResult<TInput = string, TExpected = unknown> {
  case: EvalCase<TInput, TExpected>;
  output: unknown;
  scores: Record<string, ScoreResult>;
  durationMs: number;
  costUsd?: number;
  error?: string;
}

/** 전체 eval 리포트 */
export interface EvalReport<TInput = string, TExpected = unknown> {
  dataset: string;
  timestamp: string;
  results: CaseResult<TInput, TExpected>[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
    totalCostUsd: number;
    totalDurationMs: number;
  };
}

/** 에이전트 실행 함수 시그니처 */
export type AgentFn<TInput> = (
  input: TInput
) => Promise<{ output: unknown; costUsd?: number }>;

/** scorer 함수 시그니처 */
export type Scorer<TExpected = unknown> = (
  output: unknown,
  expected: TExpected
) => ScoreResult;

/** runEval 옵션 */
export interface RunEvalOptions<TInput, TExpected> {
  dataset: EvalDataset<TInput, TExpected>;
  agent: AgentFn<TInput>;
  scorers: Record<string, Scorer<TExpected>>;
  timeout?: number;
  maxCost?: number;
  tags?: string[];
}
```

**Step 4: 타입체크 확인**

Run: `cd /Users/isc010252/dev/agents && pnpm exec tsc --noEmit -p packages/eval/tsconfig.json`
Expected: 에러 없음

**Step 5: 커밋**

```bash
git add packages/eval/
git commit -m "feat: @agents/eval 패키지 스캐폴딩 + 코어 타입 정의"
```

---

### Task 2: 내장 Scorers 구현

**Files:**
- Create: `packages/eval/src/scorers.ts`

**Step 1: scorer 함수들 작성**

`packages/eval/src/scorers.ts`:

```typescript
import type { ScoreResult, Scorer } from "./types.js";

/** 정확 일치 */
export function exactMatch<T>(): Scorer<T> {
  return (output: unknown, expected: T): ScoreResult => {
    const pass = JSON.stringify(output) === JSON.stringify(expected);
    return { score: pass ? 1.0 : 0.0, pass };
  };
}

/** 문자열 포함 여부 */
export function contains(substring: string): Scorer<unknown> {
  return (output: unknown): ScoreResult => {
    const text = String(output);
    const pass = text.includes(substring);
    return {
      score: pass ? 1.0 : 0.0,
      pass,
      reason: pass ? undefined : `"${substring}" not found in output`,
    };
  };
}

/** 여러 문자열 중 하나라도 포함 */
export function containsAny(substrings: string[]): Scorer<unknown> {
  return (output: unknown): ScoreResult => {
    const text = String(output);
    const found = substrings.filter((s) => text.includes(s));
    const pass = found.length > 0;
    return {
      score: pass ? found.length / substrings.length : 0.0,
      pass,
      reason: pass ? undefined : `None of [${substrings.join(", ")}] found`,
    };
  };
}

/** 정규식 매칭 — 매칭 비율을 점수로 */
export function matchesAll(patterns: RegExp[]): Scorer<unknown> {
  return (output: unknown): ScoreResult => {
    const text = String(output);
    const matched = patterns.filter((p) => p.test(text));
    const score = patterns.length > 0 ? matched.length / patterns.length : 0;
    return {
      score,
      pass: matched.length === patterns.length,
      reason:
        matched.length < patterns.length
          ? `${matched.length}/${patterns.length} patterns matched`
          : undefined,
    };
  };
}

/** 최소 길이 체크 */
export function minLength(min: number): Scorer<unknown> {
  return (output: unknown): ScoreResult => {
    const len = String(output).length;
    const pass = len >= min;
    return {
      score: pass ? 1.0 : len / min,
      pass,
      reason: pass ? undefined : `Length ${len} < minimum ${min}`,
    };
  };
}

/** 커스텀 scorer 생성 헬퍼 */
export function custom<TExpected>(
  fn: (output: unknown, expected: TExpected) => { score: number; reason?: string }
): Scorer<TExpected> {
  return (output: unknown, expected: TExpected): ScoreResult => {
    const result = fn(output, expected);
    return { ...result, pass: result.score >= 0.5 };
  };
}
```

**Step 2: 타입체크 확인**

Run: `cd /Users/isc010252/dev/agents && pnpm exec tsc --noEmit -p packages/eval/tsconfig.json`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add packages/eval/src/scorers.ts
git commit -m "feat: 내장 scorers 구현 (exactMatch, contains, matchesAll 등)"
```

---

### Task 3: Runner 구현

**Files:**
- Create: `packages/eval/src/runner.ts`

**Step 1: runner 작성**

`packages/eval/src/runner.ts`:

```typescript
import type {
  CaseResult,
  EvalCase,
  EvalReport,
  RunEvalOptions,
  ScoreResult,
} from "./types.js";

export async function runEval<TInput, TExpected>(
  options: RunEvalOptions<TInput, TExpected>
): Promise<EvalReport<TInput, TExpected>> {
  const { dataset, agent, scorers, timeout = 60_000, maxCost, tags } = options;

  // 태그 필터링
  const cases = tags
    ? dataset.cases.filter((c) =>
        c.tags?.some((t) => tags.includes(t))
      )
    : dataset.cases;

  console.log(
    `\n[eval] "${dataset.name}" 시작 — ${cases.length}개 케이스${tags ? ` (tags: ${tags.join(", ")})` : ""}\n`
  );

  const results: CaseResult<TInput, TExpected>[] = [];
  let totalCost = 0;

  for (const evalCase of cases) {
    // 비용 상한 체크
    if (maxCost && totalCost >= maxCost) {
      console.log(`[eval] 비용 상한 도달 ($${maxCost}). 중단.`);
      break;
    }

    console.log(`  [${evalCase.id}] ${evalCase.name}...`);
    const start = Date.now();

    let output: unknown;
    let costUsd: number | undefined;
    let error: string | undefined;

    try {
      const result = await Promise.race([
        agent(evalCase.input),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeout)
        ),
      ]);
      output = result.output;
      costUsd = result.costUsd;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      output = "";
    }

    const durationMs = Date.now() - start;

    // 채점
    const scores: Record<string, ScoreResult> = {};
    if (!error) {
      for (const [name, scorer] of Object.entries(scorers)) {
        try {
          scores[name] = scorer(output, evalCase.expected);
        } catch (err) {
          scores[name] = {
            score: 0,
            pass: false,
            reason: `Scorer error: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      }
    } else {
      // 에러 시 모든 scorer 0점
      for (const name of Object.keys(scorers)) {
        scores[name] = { score: 0, pass: false, reason: error };
      }
    }

    if (costUsd) totalCost += costUsd;

    const caseResult: CaseResult<TInput, TExpected> = {
      case: evalCase,
      output,
      scores,
      durationMs,
      costUsd,
      error,
    };
    results.push(caseResult);

    // 케이스 결과 즉시 출력
    const allPassed = Object.values(scores).every((s) => s.pass);
    const avgScore =
      Object.values(scores).reduce((sum, s) => sum + s.score, 0) /
      Math.max(Object.values(scores).length, 1);
    console.log(
      `    ${allPassed ? "PASS" : "FAIL"} | score: ${avgScore.toFixed(2)} | ${(durationMs / 1000).toFixed(1)}s${costUsd ? ` | $${costUsd.toFixed(4)}` : ""}${error ? ` | ERROR: ${error}` : ""}`
    );
  }

  // 요약 계산
  const summary = computeSummary(results);

  return {
    dataset: dataset.name,
    timestamp: new Date().toISOString(),
    results,
    summary,
  };
}

function computeSummary<TInput, TExpected>(
  results: CaseResult<TInput, TExpected>[]
): EvalReport<TInput, TExpected>["summary"] {
  let passed = 0;
  let totalScore = 0;
  let totalCost = 0;
  let totalDuration = 0;

  for (const r of results) {
    const scores = Object.values(r.scores);
    const allPassed = scores.every((s) => s.pass);
    if (allPassed) passed++;
    totalScore +=
      scores.reduce((sum, s) => sum + s.score, 0) /
      Math.max(scores.length, 1);
    totalCost += r.costUsd ?? 0;
    totalDuration += r.durationMs;
  }

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    avgScore: results.length > 0 ? totalScore / results.length : 0,
    totalCostUsd: totalCost,
    totalDurationMs: totalDuration,
  };
}
```

**Step 2: 타입체크 확인**

Run: `cd /Users/isc010252/dev/agents && pnpm exec tsc --noEmit -p packages/eval/tsconfig.json`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add packages/eval/src/runner.ts
git commit -m "feat: eval runner 구현 (태그 필터, 타임아웃, 비용 상한)"
```

---

### Task 4: Reporter 구현

**Files:**
- Create: `packages/eval/src/reporter.ts`

**Step 1: reporter 작성**

`packages/eval/src/reporter.ts`:

```typescript
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { EvalReport } from "./types.js";

/** 콘솔에 테이블 형식으로 출력 */
export function printReport(report: EvalReport): void {
  const { summary, results } = report;

  console.log("\n" + "═".repeat(70));
  console.log(`  ${report.dataset}  |  ${report.timestamp}`);
  console.log("═".repeat(70));

  // 헤더
  console.log(
    padEnd("Case", 25) +
      padEnd("Score", 8) +
      padEnd("Pass", 7) +
      padEnd("Cost", 10) +
      padEnd("Time", 8)
  );
  console.log("─".repeat(70));

  // 각 케이스
  for (const r of results) {
    const scores = Object.values(r.scores);
    const avgScore =
      scores.reduce((sum, s) => sum + s.score, 0) /
      Math.max(scores.length, 1);
    const allPassed = scores.every((s) => s.pass);

    console.log(
      padEnd(truncate(r.case.name, 23), 25) +
        padEnd(avgScore.toFixed(2), 8) +
        padEnd(allPassed ? "PASS" : "FAIL", 7) +
        padEnd(r.costUsd ? `$${r.costUsd.toFixed(4)}` : "-", 10) +
        padEnd(`${(r.durationMs / 1000).toFixed(1)}s`, 8)
    );

    // 실패한 scorer 상세
    if (!allPassed) {
      for (const [name, score] of Object.entries(r.scores)) {
        if (!score.pass) {
          console.log(`    └ ${name}: ${score.reason ?? "failed"}`);
        }
      }
    }
  }

  // 요약
  console.log("─".repeat(70));
  console.log(
    padEnd("Summary", 25) +
      padEnd(summary.avgScore.toFixed(2), 8) +
      padEnd(`${summary.passed}/${summary.total}`, 7) +
      padEnd(`$${summary.totalCostUsd.toFixed(4)}`, 10) +
      padEnd(`${(summary.totalDurationMs / 1000).toFixed(1)}s`, 8)
  );
  console.log("═".repeat(70) + "\n");
}

/** JSON 파일로 저장 */
export async function saveReport(
  report: EvalReport,
  dir: string
): Promise<string> {
  await mkdir(dir, { recursive: true });
  const ts = report.timestamp.replace(/[:.]/g, "").slice(0, 15);
  const filename = `${ts}-${report.dataset}.json`;
  const filepath = `${dir}/${filename}`;
  await writeFile(filepath, JSON.stringify(report, null, 2));
  console.log(`[eval] 결과 저장: ${filepath}`);
  return filepath;
}

function padEnd(str: string, len: number): string {
  return str.padEnd(len);
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 2) + ".." : str;
}
```

**Step 2: index.ts 배럴 파일 생성**

`packages/eval/src/index.ts`:

```typescript
export * from "./types.js";
export * from "./scorers.js";
export { runEval } from "./runner.js";
export { printReport, saveReport } from "./reporter.js";
```

**Step 3: 타입체크 확인**

Run: `cd /Users/isc010252/dev/agents && pnpm exec tsc --noEmit -p packages/eval/tsconfig.json`
Expected: 에러 없음

**Step 4: 커밋**

```bash
git add packages/eval/src/reporter.ts packages/eval/src/index.ts
git commit -m "feat: eval reporter (콘솔 테이블 + JSON 저장) + index 배럴"
```

---

### Task 5: fe-auto eval 데이터셋 작성

**Files:**
- Create: `services/fe-auto/evals/datasets/spec-eval.dataset.ts`

**Step 1: spec-agent용 데이터셋 작성**

`services/fe-auto/evals/datasets/spec-eval.dataset.ts`:

```typescript
import type { EvalDataset } from "@agents/eval";

interface SpecInput {
  planningDoc: string;
  ticketId?: string;
}

interface SpecExpected {
  requiredSections: RegExp[];
  qualityPatterns: RegExp[];
  minLength: number;
}

export const specDataset: EvalDataset<SpecInput, SpecExpected> = {
  name: "fe-auto-spec",
  cases: [
    {
      id: "simple-list-page",
      name: "단순 목록 페이지 스펙 생성",
      tags: ["spec"],
      input: {
        planningDoc: `# 주문 목록 페이지
주문 관리 시스템에서 주문 목록을 보여주는 페이지입니다.
- 주문 번호, 고객명, 금액, 상태를 테이블로 표시
- 상태별 필터링 가능 (전체, 대기, 완료, 취소)
- 검색 가능 (주문번호, 고객명)
- 주문 클릭 시 상세 페이지로 이동
API: GET /api/orders (query: status, search, page)`,
      },
      expected: {
        requiredSections: [
          /##.*요구사항/i,
          /##.*컴포넌트/i,
          /##.*API/i,
          /##.*폴더/i,
          /##.*스코프\s*아웃/i,
          /##.*확인\s*필요/i,
        ],
        qualityPatterns: [
          /\[MUST\]/i,
          /├──|└──/,
          /(GET|POST|PUT|DELETE|PATCH)\s+\//,
        ],
        minLength: 500,
      },
    },
    {
      id: "crud-with-modal",
      name: "CRUD + 모달 스펙 생성",
      tags: ["spec"],
      input: {
        planningDoc: `# 상품 관리
상품을 등록/수정/삭제할 수 있는 관리 페이지입니다.
- 상품 목록 (이미지 썸네일, 상품명, 가격, 재고)
- 상품 등록: 모달로 열림 (상품명, 설명, 가격, 카테고리, 이미지 업로드)
- 상품 수정: 등록과 동일 모달, 기존 데이터 프리필
- 상품 삭제: 확인 다이얼로그 후 삭제
API:
  GET /api/products (query: category, search)
  POST /api/products (body: FormData)
  PUT /api/products/:id (body: FormData)
  DELETE /api/products/:id`,
      },
      expected: {
        requiredSections: [
          /##.*요구사항/i,
          /##.*컴포넌트/i,
          /##.*API/i,
          /##.*폴더/i,
          /##.*스코프\s*아웃/i,
          /##.*확인\s*필요/i,
        ],
        qualityPatterns: [
          /\[MUST\]/i,
          /├──|└──/,
          /(GET|POST|PUT|DELETE|PATCH)\s+\//,
        ],
        minLength: 800,
      },
    },
  ],
};
```

**Step 2: 커밋**

```bash
git add services/fe-auto/evals/
git commit -m "feat: fe-auto spec eval 데이터셋 (목록 페이지, CRUD 모달)"
```

---

### Task 6: fe-auto Scorers 작성

**Files:**
- Create: `services/fe-auto/evals/scorers/spec-scorer.ts`

**Step 1: spec-agent 전용 scorer 작성**

`services/fe-auto/evals/scorers/spec-scorer.ts`:

```typescript
import { matchesAll, minLength, custom } from "@agents/eval";
import type { Scorer } from "@agents/eval";

interface SpecExpected {
  requiredSections: RegExp[];
  qualityPatterns: RegExp[];
  minLength: number;
}

/** 필수 섹션 존재 여부 */
export const hasRequiredSections: Scorer<SpecExpected> = (output, expected) => {
  return matchesAll(expected.requiredSections)(output, expected);
};

/** 구조적 품질 패턴 */
export const hasQualityPatterns: Scorer<SpecExpected> = (output, expected) => {
  return matchesAll(expected.qualityPatterns)(output, expected);
};

/** 최소 길이 충족 */
export const meetsMinLength: Scorer<SpecExpected> = (output, expected) => {
  return minLength(expected.minLength)(output, expected);
};

/** 종합 spec scorer 모음 */
export const specScorers: Record<string, Scorer<SpecExpected>> = {
  requiredSections: hasRequiredSections,
  qualityPatterns: hasQualityPatterns,
  minLength: meetsMinLength,
};
```

**Step 2: 타입체크 확인**

Run: `cd /Users/isc010252/dev/agents && pnpm exec tsc --noEmit -p services/fe-auto/tsconfig.json`
Expected: 에러 없음 (또는 @agents/eval import 관련 — Task 7에서 해결)

**Step 3: 커밋**

```bash
git add services/fe-auto/evals/scorers/
git commit -m "feat: fe-auto spec scorer (섹션 체크, 품질 패턴, 길이)"
```

---

### Task 7: Agent Wrapper + CLI 진입점

**Files:**
- Create: `services/fe-auto/evals/agents/spec-agent-wrapper.ts`
- Create: `services/fe-auto/evals/run.ts`
- Modify: `services/fe-auto/package.json` — eval 스크립트 추가

**Step 1: spec-agent를 AgentFn으로 래핑**

`services/fe-auto/evals/agents/spec-agent-wrapper.ts`:

```typescript
import type { AgentFn } from "@agents/eval";
import { runSpecAgent } from "../../agents/spec-agent.js";

interface SpecInput {
  planningDoc: string;
  ticketId?: string;
}

export const specAgentFn: AgentFn<SpecInput> = async (input) => {
  const result = await runSpecAgent(input);
  return {
    output: result.output,
    costUsd: result.cost,
  };
};
```

**Step 2: CLI 진입점 작성**

`services/fe-auto/evals/run.ts`:

```typescript
import { runEval, printReport, saveReport } from "@agents/eval";
import { specDataset } from "./datasets/spec-eval.dataset.js";
import { specScorers } from "./scorers/spec-scorer.js";
import { specAgentFn } from "./agents/spec-agent-wrapper.js";

async function main() {
  const args = process.argv.slice(2);
  const tags = args
    .find((a) => a.startsWith("--tag=") || a.startsWith("--tag "))
    ?.replace("--tag=", "")
    ?.replace("--tag ", "");
  const tagFilter = tags ? tags.split(",") : undefined;

  const maxCostArg = args.find((a) => a.startsWith("--max-cost="));
  const maxCost = maxCostArg
    ? parseFloat(maxCostArg.replace("--max-cost=", ""))
    : undefined;

  // Spec eval
  const report = await runEval({
    dataset: specDataset,
    agent: specAgentFn,
    scorers: specScorers,
    timeout: 120_000,
    maxCost,
    tags: tagFilter,
  });

  printReport(report);
  await saveReport(report, new URL("./results", import.meta.url).pathname);
}

main().catch((err) => {
  console.error("Eval 에러:", err.message);
  process.exit(1);
});
```

**Step 3: fe-auto package.json에 eval 스크립트 추가**

`services/fe-auto/package.json`에 scripts 추가:

```json
{
  "scripts": {
    "dev": "tsx main.ts",
    "eval": "unset CLAUDECODE && tsx evals/run.ts"
  },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.1",
    "@agents/eval": "workspace:*"
  }
}
```

**Step 4: .gitignore에 결과 폴더 추가**

`services/fe-auto/evals/.gitignore`:

```
results/
```

**Step 5: 루트 package.json에 eval 스크립트 추가**

루트 `package.json`의 scripts에 추가:

```json
"eval:fe-auto": "unset CLAUDECODE && pnpm --filter fe-auto run eval --"
```

**Step 6: pnpm install 실행하여 workspace 링크**

Run: `cd /Users/isc010252/dev/agents && pnpm install`
Expected: @agents/eval이 fe-auto에 링크됨

**Step 7: 타입체크 확인**

Run: `cd /Users/isc010252/dev/agents && pnpm exec tsc --noEmit -p services/fe-auto/tsconfig.json`
Expected: 에러 없음

**Step 8: 커밋**

```bash
git add services/fe-auto/evals/ services/fe-auto/package.json package.json pnpm-lock.yaml
git commit -m "feat: fe-auto eval CLI (agent wrapper + run.ts + pnpm scripts)"
```

---

### Task 8: 실행 테스트 (live eval)

**Step 1: dry run — 데이터셋 1개만 실행**

Run: `cd /Users/isc010252/dev/agents && pnpm eval:fe-auto --tag=spec`
Expected: spec 데이터셋 2개 케이스 실행, 콘솔 테이블 출력, results/ 폴더에 JSON 저장

**Step 2: 결과 확인**

- 콘솔에 테이블이 정상 출력되는지
- `services/fe-auto/evals/results/` 에 JSON 파일이 생성되었는지
- 각 케이스의 score, pass/fail이 합리적인지

**Step 3: 문제가 있으면 수정 후 재실행**

**Step 4: 최종 커밋**

```bash
git add -A
git commit -m "fix: eval 실행 결과 기반 조정"
```

---

## 실행 순서 요약

| Task | 내용 | 의존성 |
|------|------|--------|
| 1 | packages/eval 스캐폴딩 + 타입 | 없음 |
| 2 | 내장 Scorers | Task 1 |
| 3 | Runner | Task 1 |
| 4 | Reporter + index | Task 1 |
| 5 | fe-auto 데이터셋 | Task 1 (타입만) |
| 6 | fe-auto Scorers | Task 2 |
| 7 | Agent Wrapper + CLI | Task 3, 4, 5, 6 |
| 8 | 실행 테스트 | Task 7 |

**병렬 가능:** Task 2, 3, 4는 서로 독립 → 동시 진행 가능
**병렬 가능:** Task 5, 6은 Task 1 완료 후 동시 진행 가능
