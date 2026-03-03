import { runCodeAgent } from "./agents/code-agent.js";
import { runReviewAgent } from "./agents/review-agent.js";
import { runSpecAgent } from "./agents/spec-agent.js";
import { loadSpec } from "./conventions.js";
import type { FeAutoInput, PipelineState } from "./types.js";

const MAX_CODE_REVIEW_CYCLES = 2;

// ──────────────────────────────────────────────
// CLI 입력 파싱
// ──────────────────────────────────────────────
function parseArgs(): FeAutoInput {
  const args = process.argv.slice(2);
  const specPath = args[0];

  if (!specPath) {
    console.error("사용법:");
    console.error("  pnpm fe-auto <스펙파일> [프로젝트경로]");
    console.error("  pnpm fe-auto --convert <기획문서> [프로젝트경로] [--ticket LINEAR-123]");
    console.error("");
    console.error("예시:");
    console.error("  pnpm fe-auto ./spec.md ~/work/ishopcare-frontend");
    console.error("  pnpm fe-auto --convert ./planning.md ~/work/ishopcare-frontend --ticket FE-456");
    process.exit(1);
  }

  // --convert 모드: 기획문서 → Spec Agent → Code Agent
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
      convertSpec: true,
      ticketId: ticketIdx !== -1 ? args[ticketIdx + 1] : undefined,
    };
  }

  const projectPath = args[1] || "~/work/ishopcare-frontend";
  return { specPath, projectPath };
}

// ──────────────────────────────────────────────
// 오케스트레이터 — 전체 파이프라인 관리
// ──────────────────────────────────────────────
async function main() {
  const input = parseArgs();
  const rawDoc = loadSpec(input.specPath);

  let spec: string;
  let totalCost = 0;

  // ── 기획문서 변환 모드 ──
  if (input.convertSpec) {
    console.log("═".repeat(50));
    console.log("fe-auto 시작 (기획문서 → 스펙 변환 모드)");
    console.log(`기획문서: ${input.specPath}`);
    console.log(`프로젝트: ${input.projectPath}`);
    if (input.ticketId) console.log(`티켓: ${input.ticketId}`);
    console.log("═".repeat(50));

    const specResult = await runSpecAgent({
      planningDoc: rawDoc,
      ticketId: input.ticketId,
    });
    spec = specResult.output;
    totalCost += specResult.cost;
  } else {
    console.log("═".repeat(50));
    console.log("fe-auto 시작");
    console.log(`스펙: ${input.specPath}`);
    console.log(`프로젝트: ${input.projectPath}`);
    console.log("═".repeat(50));
    spec = rawDoc;
  }

  const state: PipelineState = { input, spec };

  // ── Code ↔ Review 루프 ──
  console.log("\n[Pipeline] Code → Review 루프");

  let reviewPassed = false;
  let codeOutput = "";
  let reviewFeedback = "";

  for (let cycle = 0; cycle < MAX_CODE_REVIEW_CYCLES; cycle++) {
    console.log(`\n--- Cycle ${cycle + 1}/${MAX_CODE_REVIEW_CYCLES} ---`);

    // Code Agent (첫 사이클: 스펙 기반 생성 / 이후: 리뷰 피드백 반영)
    const codeResult = await runCodeAgent(
      input,
      state.spec,
      cycle > 0 ? reviewFeedback : undefined
    );
    codeOutput = codeResult.output;
    totalCost += codeResult.cost;

    // Review Agent
    const reviewResult = await runReviewAgent(
      input.projectPath,
      state.spec,
      codeOutput
    );
    totalCost += reviewResult.cost;

    if (
      reviewResult.output.includes("통과") ||
      reviewResult.output.includes("이슈 없음")
    ) {
      reviewPassed = true;
      state.reviewResult = reviewResult.output;
      break;
    }

    reviewFeedback = reviewResult.output;
    console.log(
      `Cycle ${cycle + 1} 리뷰 미통과. ${cycle + 1 < MAX_CODE_REVIEW_CYCLES ? "재시도..." : "최대 사이클 도달."}`
    );
  }

  // ── 결과 요약 ──
  console.log("\n" + "═".repeat(50));
  console.log("결과 요약");
  console.log("═".repeat(50));
  console.log(`스펙: ${input.specPath}`);
  console.log(`총 비용: $${totalCost.toFixed(4)}`);
  console.log(`리뷰: ${reviewPassed ? "통과" : "이슈 있음 (수동 확인 필요)"}`);
  console.log("\nPR 생성은 검수 후 수동으로 진행하세요.");
}

main().catch((err) => {
  console.error("에러:", err.message);
  process.exit(1);
});
