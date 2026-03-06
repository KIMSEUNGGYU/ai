import { runCodeAgent } from "./agents/code-agent.js";
import { runReviewAgent } from "./agents/review-agent.js";
import { runReviewAgentOpenAI } from "./agents/review-agent-openai.js";
import { runSpecAgent } from "./agents/spec-agent.js";
import { loadSpec } from "./conventions.js";
import type { AgentResult, FeAutoInput, PipelineState } from "./types.js";

type ReviewerType = "claude" | "openai" | "both";

const MAX_CODE_REVIEW_CYCLES = 5;
const STAGNATION_THRESHOLD = 2; // 연속 점수 정체 시 탈출

// ──────────────────────────────────────────────
// CLI 입력 파싱
// ──────────────────────────────────────────────
function parseArgs(): FeAutoInput {
  const args = process.argv.slice(2);
  const specPath = args[0];

  if (!specPath) {
    console.error("사용법:");
    console.error("  pnpm fe-auto <스펙파일> [프로젝트경로] [--reviewer claude|openai|both]");
    console.error("  pnpm fe-auto --convert <기획문서> [프로젝트경로] [--ticket LINEAR-123] [--reviewer claude|openai|both]");
    console.error("");
    console.error("예시:");
    console.error("  pnpm fe-auto ./spec.md ~/work/ishopcare-frontend");
    console.error("  pnpm fe-auto ./spec.md ~/work/ishopcare-frontend --reviewer both");
    console.error("  pnpm fe-auto --convert ./planning.md ~/work/ishopcare-frontend --ticket FE-456");
    process.exit(1);
  }

  // --convert 모드: 기획문서 → Spec Agent → Code Agent
  const convertIdx = args.indexOf("--convert");
  const ticketIdx = args.indexOf("--ticket");
  const reviewerIdx = args.indexOf("--reviewer");
  const reviewer = (reviewerIdx !== -1 ? args[reviewerIdx + 1] : "claude") as ReviewerType;

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
      reviewer,
    };
  }

  const projectPath = args[1] || "~/work/ishopcare-frontend";
  return { specPath, projectPath, reviewer };
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

  // ── Code ↔ Review 루프 (Ralph 패턴: 자기참조 + 전략 진화) ──
  console.log("\n[Pipeline] Code → Review 루프 (Ralph)");

  let reviewPassed = false;
  let codeOutput = "";
  let reviewFeedback = "";
  let previousStrategy = "스펙 기반 초기 구현";
  const scoreHistory: number[] = [];

  for (let cycle = 0; cycle < MAX_CODE_REVIEW_CYCLES; cycle++) {
    console.log(`\n--- Cycle ${cycle + 1}/${MAX_CODE_REVIEW_CYCLES} ---`);
    console.log(`[전략] ${previousStrategy}`);

    // Code Agent (첫 사이클: 스펙 기반 / 이후: 메타 분석 피드백 반영)
    const codeResult = await runCodeAgent(
      input,
      state.spec,
      cycle > 0 ? reviewFeedback : undefined
    );
    codeOutput = codeResult.output;
    totalCost += codeResult.cost;

    // Review Agent — reviewer 옵션에 따라 분기
    const reviewResult = await executeReview(
      input.reviewer ?? "claude",
      input.projectPath,
      state.spec,
      codeOutput
    );
    totalCost += reviewResult.cost;

    // 점수 추출 (리뷰 결과에서 숫자 점수 파싱)
    const scoreMatch = reviewResult.output.match(/(\d+)\s*[/\/]\s*100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    scoreHistory.push(score);
    console.log(`[점수] ${score}/100 (히스토리: ${scoreHistory.join(" → ")})`);

    if (
      reviewResult.output.includes("통과") ||
      reviewResult.output.includes("이슈 없음") ||
      score >= 90
    ) {
      reviewPassed = true;
      state.reviewResult = reviewResult.output;
      console.log("[Ralph] 검증 통과!");
      break;
    }

    // ── Ralph 핵심: 정체 감지 ──
    if (scoreHistory.length >= STAGNATION_THRESHOLD) {
      const recent = scoreHistory.slice(-STAGNATION_THRESHOLD);
      const isStagnant = recent.every((s) => Math.abs(s - recent[0]) <= 5);
      if (isStagnant) {
        console.log("[Ralph] 정체 감지! 전략을 근본적으로 전환합니다.");
        previousStrategy = `이전 전략(${previousStrategy})이 ${STAGNATION_THRESHOLD}회 연속 정체 → 완전히 다른 접근으로 전환. 기존 코드를 버리고 구조부터 재설계`;
      }
    }

    // ── Ralph 핵심: 자기참조 메타 분석 → 전략 진화 ──
    const scoreImproving = scoreHistory.length >= 2 &&
      score > scoreHistory[scoreHistory.length - 2];

    const metaAnalysis = [
      `## 메타 분석 (Cycle ${cycle + 1})`,
      `- 현재 점수: ${score}/100`,
      `- 점수 추이: ${scoreHistory.join(" → ")} (${scoreImproving ? "개선 중" : "정체/하락"})`,
      `- 이전 전략: ${previousStrategy}`,
      `- 전략 평가: ${scoreImproving ? "방향은 맞음, 같은 방향으로 더 깊이 개선" : "접근법 자체를 바꿔야 함"}`,
      "",
      `## 리뷰 피드백`,
      reviewResult.output,
      "",
      `## 다음 전략 지시`,
      scoreImproving
        ? "현재 방향이 효과적이므로 리뷰 피드백의 구체적 지적사항만 집중 수정하세요."
        : "이전 접근이 효과가 없었습니다. 왜 실패했는지 근본 원인을 분석하고, 코드 구조/설계 자체를 다르게 접근하세요.",
    ].join("\n");

    reviewFeedback = metaAnalysis;
    previousStrategy = scoreImproving
      ? `${previousStrategy} → 피드백 반영 심화`
      : `전략 전환: 리뷰 실패 원인 기반 재설계`;

    console.log(
      `Cycle ${cycle + 1} 리뷰 미통과. ${scoreImproving ? "개선 중 →" : "전략 전환 →"} ${cycle + 1 < MAX_CODE_REVIEW_CYCLES ? "재시도..." : "최대 사이클 도달."}`
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

// ──────────────────────────────────────────────
// 리뷰어 실행 — claude / openai / both
// ──────────────────────────────────────────────
async function executeReview(
  reviewer: ReviewerType,
  projectPath: string,
  spec: string,
  codeOutput: string
): Promise<AgentResult> {
  if (reviewer === "claude") {
    return runReviewAgent(projectPath, spec, codeOutput);
  }

  if (reviewer === "openai") {
    return runReviewAgentOpenAI(projectPath, spec, codeOutput);
  }

  // both: 병렬 실행 → 결과 비교
  console.log("\n[Both] Claude + OpenAI 리뷰 병렬 실행");
  const [claudeResult, openaiResult] = await Promise.all([
    runReviewAgent(projectPath, spec, codeOutput),
    runReviewAgentOpenAI(projectPath, spec, codeOutput),
  ]);

  console.log("\n" + "─".repeat(50));
  console.log("[비교] Claude vs OpenAI 리뷰 결과");
  console.log("─".repeat(50));
  console.log("\n📋 Claude 리뷰:");
  console.log(claudeResult.output.slice(0, 500));
  console.log("\n📋 OpenAI 리뷰:");
  console.log(openaiResult.output.slice(0, 500));
  console.log("\n─".repeat(50));
  console.log(`비용: Claude $${claudeResult.cost.toFixed(4)} | OpenAI $${openaiResult.cost.toFixed(4)}`);
  console.log("─".repeat(50));

  // 두 결과를 합쳐서 반환 (Ralph 루프에서 둘 다 참고)
  return {
    output: `## Claude 리뷰\n${claudeResult.output}\n\n## OpenAI 리뷰\n${openaiResult.output}`,
    turns: claudeResult.turns + openaiResult.turns,
    cost: claudeResult.cost + openaiResult.cost,
  };
}

main().catch((err) => {
  console.error("에러:", err.message);
  process.exit(1);
});
