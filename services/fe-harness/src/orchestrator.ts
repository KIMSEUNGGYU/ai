import { join } from 'node:path';
import { HarnessFiles } from './lib/files.js';
import { runStaticGate } from './lib/static-gate.js';
import { parseEvalLog, checkConvergence } from './lib/scoring.js';
import { runPlanner } from './agents/planner.js';
import { runGenerator } from './agents/generator.js';
import { runEvaluator } from './agents/evaluator.js';
import type { OrchestrateOptions, HarnessConfig, EvalResult, SprintResult, SprintPlan } from './types.js';

function loadConfig(conventionsDir: string): HarnessConfig {
  return {
    conventions: [
      join(conventionsDir, 'code-principles.md'),
      join(conventionsDir, 'folder-structure.md'),
      join(conventionsDir, 'api-layer.md'),
      join(conventionsDir, 'coding-style.md'),
    ],
    staticGate: ['tsc --noEmit', 'biome check'],
    scoring: {
      qualityThreshold: 8.0,
      contractWeight: 0.6,
      openEvalWeight: 0.3,
      contrarianWeight: 0.1,
    },
    limits: {
      staticGateRetries: 3,
      evalLoopRetries: 3,
    },
  };
}

function parseSprintsFromSpec(spec: string): SprintPlan[] {
  const sprints: SprintPlan[] = [];
  const regex = /### Sprint (\d+):\s*(.+)\n\s*범위:\s*(.+)\n\s*산출물:\s*(.+)/g;
  let match;
  while ((match = regex.exec(spec)) !== null) {
    sprints.push({
      number: parseInt(match[1]),
      name: match[2].trim(),
      scope: match[3].trim(),
      deliverables: match[4].trim(),
    });
  }
  return sprints;
}

export async function orchestrate(options: OrchestrateOptions): Promise<void> {
  const { input, domain, page, targetDir } = options;
  const files = new HarnessFiles(targetDir, domain, page);

  // TODO: conventionsDir를 설정 파일에서 읽도록
  const conventionsDir = join(process.env.HOME ?? '', 'dev/ai/plugins/fe-workflow/conventions');
  const config = loadConfig(conventionsDir);

  console.log(`\n=== FE 하네스 시작 ===`);
  console.log(`도메인: ${domain}, 페이지: ${page}`);
  console.log(`대상: ${targetDir}\n`);

  // Phase 1: Planning
  console.log('--- Phase 1: Planning ---');
  const domainContext = files.read(files.domainContextPath);
  const spec = runPlanner(input, targetDir, domainContext, config);
  files.write(files.specPath, spec);
  console.log(`spec 생성: ${files.specPath}`);

  // TODO: 인터랙티브 확인 (readline 또는 별도 구현)
  console.log('\n[사람 확인] spec.md를 확인하세요. (현재 자동 진행)\n');

  // Phase 2: Build Loop
  const sprints = parseSprintsFromSpec(spec);
  console.log(`--- Phase 2: Build Loop (${sprints.length}개 Sprint) ---`);

  const sprintResults: SprintResult[] = [];

  for (const sprint of sprints) {
    console.log(`\n=== Sprint ${sprint.number}: ${sprint.name} ===`);

    // 2-1: Contract 생성
    const contractPrompt = `spec.md 기반으로 Sprint ${sprint.number} (${sprint.name})의 contract를 생성해.
범위: ${sprint.scope}
산출물: ${sprint.deliverables}

contract 형식:
- 이번 Sprint에서 만드는 것
- 하지 말아야 할 것
- 완료 기준 (정적 게이트 + 코드 품질)
- 참조할 기존 코드`;

    // TODO: Planner 초안 → Evaluator 검토 루프
    const contract = runGenerator(spec, contractPrompt, null, '', config, targetDir);
    files.write(files.contractPath(sprint.number), contract);

    // 2-2 ~ 2-4: Generate + Gate + Eval 루프
    const evalHistory: EvalResult[] = [];
    let round = 0;
    let lastFeedback: string | null = null;
    let sprintPassed = false;

    while (round < config.limits.evalLoopRetries) {
      round++;
      console.log(`  Round ${round}:`);

      // Generate
      const code = runGenerator(spec, contract, lastFeedback, '', config, targetDir);
      console.log(`    Generator 완료`);

      // Static Gate
      const gateResult = runStaticGate(targetDir, config.staticGate);
      if (!gateResult.passed) {
        console.log(`    Static Gate FAIL: ${gateResult.errors.length}개 에러`);
        let gateRetry = 0;
        while (!gateResult.passed && gateRetry < config.limits.staticGateRetries) {
          gateRetry++;
          // TODO: Generator에게 에러 전달 후 재생성
          break; // 단순 버전: 한번 실패하면 다음 Eval로
        }
      }
      console.log(`    Static Gate 통과`);

      // Evaluate
      const evalOutput = runEvaluator(contract, code, '', config, targetDir);
      const evalResult = parseEvalLog(evalOutput);
      evalHistory.push(evalResult);

      // eval-log 저장
      files.write(files.evalLogPath(sprint.number, round), evalOutput);

      console.log(`    Evaluator: ${evalResult.passed ? 'PASS' : 'FAIL'} (${evalResult.qualityScore}/10)`);

      if (evalResult.passed) {
        sprintPassed = true;
        break;
      }

      // 수렴 감지
      const convergence = checkConvergence(evalHistory);
      console.log(`    수렴 체크: ${convergence.action} (${convergence.reason})`);

      if (convergence.action === 'accept') {
        console.log(`    정체로 수용`);
        break;
      }
      if (convergence.action === 'stop') {
        console.log(`    중단: ${convergence.reason}`);
        break;
      }

      // feedback 저장 + 다음 라운드 준비
      if (evalResult.feedback) {
        files.write(files.feedbackPath(sprint.number, round), evalResult.feedback);
        lastFeedback = evalResult.feedback;
      }
    }

    sprintResults.push({
      sprintNumber: sprint.number,
      name: sprint.name,
      rounds: round,
      finalScore: evalHistory[evalHistory.length - 1]?.qualityScore ?? 0,
      result: sprintPassed ? 'pass' : round >= config.limits.evalLoopRetries ? 'stopped' : 'stagnation',
    });
  }

  // Phase 3: Summary
  console.log('\n--- Phase 3: Summary ---');
  const summary = generateSummary(domain, page, input, sprintResults);
  files.write(files.summaryPath, summary);
  console.log(`summary 생성: ${files.summaryPath}`);
  console.log('\n=== FE 하네스 완료 ===');
}

function generateSummary(
  domain: string,
  page: string,
  input: string,
  results: SprintResult[],
): string {
  const rows = results
    .map(r => `| ${r.sprintNumber} | ${r.name} | ${r.rounds} | ${r.finalScore}/10 | ${r.result} |`)
    .join('\n');

  return `# 하네스 실행 요약

## 대상
- 도메인: ${domain}
- 페이지: ${page}
- 입력: "${input}"

## Sprint 결과
| Sprint | 범위 | 라운드 | 최종 품질 점수 | 결과 |
|--------|------|--------|--------------|------|
${rows}
`;
}
