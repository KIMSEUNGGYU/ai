import { runEval, printReport, saveReport } from "@agents/eval";
import { specDataset } from "./datasets/spec-eval.dataset.js";
import { specScorers } from "./scorers/spec-scorer.js";
import { specAgentFn } from "./agents/spec-agent-wrapper.js";

async function main() {
  const args = process.argv.slice(2);

  const tagArg = args.find((a) => a.startsWith("--tag="));
  const tagFilter = tagArg ? tagArg.replace("--tag=", "").split(",") : undefined;

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

  const resultsDir = new URL("./results", import.meta.url).pathname;
  await saveReport(report, resultsDir);
}

main().catch((err) => {
  console.error("Eval 에러:", err.message);
  process.exit(1);
});
