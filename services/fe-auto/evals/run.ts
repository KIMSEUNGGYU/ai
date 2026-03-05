import { runEval, printReport, saveReport } from "@agents/eval";
import { specDataset } from "./datasets/spec-eval.dataset.js";
import { codeDataset } from "./datasets/code-eval.dataset.js";
import { specScorers } from "./scorers/spec-scorer.js";
import { codeScorers } from "./scorers/code-scorer.js";
import { specAgentFn } from "./agents/spec-agent-wrapper.js";
import { codeAgentFn } from "./agents/code-agent-wrapper.js";

async function main() {
  const args = process.argv.slice(2);

  const tagArg = args.find((a) => a.startsWith("--tag="));
  const tagFilter = tagArg
    ? tagArg.replace("--tag=", "").split(",")
    : undefined;

  const maxCostArg = args.find((a) => a.startsWith("--max-cost="));
  const maxCost = maxCostArg
    ? parseFloat(maxCostArg.replace("--max-cost=", ""))
    : undefined;

  const resultsDir = new URL("./results", import.meta.url).pathname;
  const shouldRunSpec = !tagFilter || tagFilter.includes("spec");
  const shouldRunCode = !tagFilter || tagFilter.includes("code");

  // Spec eval
  if (shouldRunSpec) {
    const specReport = await runEval({
      dataset: specDataset,
      agent: specAgentFn,
      scorers: specScorers,
      timeout: 120_000,
      maxCost,
      tags: tagFilter,
    });
    printReport(specReport);
    await saveReport(specReport, resultsDir);
  }

  // Code eval
  if (shouldRunCode) {
    const codeReport = await runEval({
      dataset: codeDataset,
      agent: codeAgentFn,
      scorers: codeScorers,
      timeout: 300_000,
      maxCost,
      tags: tagFilter,
    });
    printReport(codeReport);
    await saveReport(codeReport, resultsDir);
  }
}

main().catch((err) => {
  console.error("Eval 에러:", err.message);
  process.exit(1);
});
