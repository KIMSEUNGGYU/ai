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
    console.error(
      '  pnpm dual-review "요구사항" --target <프로젝트경로>'
    );
    console.error("");
    console.error("예시:");
    console.error(
      '  pnpm dual-review "로그인 페이지에 소셜 로그인 추가" --target ~/work/ishopcare-frontend'
    );
    process.exit(1);
  }

  const targetIdx = args.indexOf("--target");
  const targetProject =
    targetIdx !== -1 && args[targetIdx + 1]
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

      console.log("\n[Pipeline] 리뷰 통과!");
      console.log("\n리뷰 요약:");
      console.log(reviewResult.summary);

      if (reviewResult.issues.length > 0) {
        console.log("\n남은 이슈 (MEDIUM/LOW):");
        for (const issue of reviewResult.issues) {
          console.log(
            `  - [${issue.severity}] ${issue.file} — ${issue.message}`
          );
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
  console.log(
    `리뷰: ${reviewPassed ? "통과" : "이슈 있음 (수동 확인 필요)"}`
  );

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
