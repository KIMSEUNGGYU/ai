import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { HarnessFiles } from './lib/files.js';
import { runStaticGate } from './lib/static-gate.js';
import { parseEvalLog, checkConvergence } from './lib/scoring.js';
import { runPlanner } from './agents/planner.js';
import { runGenerator } from './agents/generator.js';
import { runEvaluator } from './agents/evaluator.js';
import type { OrchestrateOptions, HarnessConfig, EvalResult, SprintResult, SprintPlan } from './types.js';

function loadConfig(conventionsDir: string, service?: string): HarnessConfig {
  const typecheckCmd = service
    ? `pnpm --filter @services/${service} run typecheck`
    : 'tsc --noEmit';

  return {
    conventions: [
      join(conventionsDir, 'code-principles.md'),
      join(conventionsDir, 'folder-structure.md'),
      join(conventionsDir, 'api-layer.md'),
      join(conventionsDir, 'coding-style.md'),
    ],
    staticGate: [typecheckCmd, 'pnpm run check'],
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
  // Sprint 헤더로 분할 후 각 섹션에서 범위/산출물 추출 (여러 줄 지원)
  const headerRegex = /### Sprint (\d+):\s*(.+)/g;
  const headers: Array<{ number: number; name: string; startIndex: number }> = [];
  let match;
  while ((match = headerRegex.exec(spec)) !== null) {
    headers.push({
      number: parseInt(match[1]),
      name: match[2].trim(),
      startIndex: match.index + match[0].length,
    });
  }

  for (let i = 0; i < headers.length; i++) {
    const sectionEnd = i + 1 < headers.length ? headers[i + 1].startIndex : spec.length;
    const section = spec.slice(headers[i].startIndex, sectionEnd);

    const scopeMatch = section.match(/범위:\s*\n?([\s\S]*?)(?=\n\s*산출물:)/);
    const deliverablesMatch = section.match(/산출물:\s*\n?([\s\S]*?)(?=\n\s*###|\n\s*$|$)/);

    sprints.push({
      number: headers[i].number,
      name: headers[i].name,
      scope: scopeMatch?.[1]?.trim() ?? '',
      deliverables: deliverablesMatch?.[1]?.trim() ?? '',
    });
  }
  return sprints;
}

function getChangedFiles(cwd: string): string[] {
  try {
    // modified + untracked 모두 감지
    const output = execSync('git status --porcelain', { cwd, stdio: 'pipe' }).toString().trim();
    return output ? output.split('\n').map(l => l.slice(3).trim()) : [];
  } catch {
    return [];
  }
}

export async function orchestrate(options: OrchestrateOptions): Promise<void> {
  const { input, domain, page, targetDir, service } = options;
  const files = new HarnessFiles(targetDir, domain, page);

  // TODO: conventionsDir를 설정 파일에서 읽도록
  const conventionsDir = join(process.env.HOME ?? '', 'dev/ai/plugins/fe-workflow/conventions');
  const config = loadConfig(conventionsDir, service);

  console.log(`\n=== FE 하네스 시작 ===`);
  console.log(`도메인: ${domain}, 페이지: ${page}`);
  console.log(`대상: ${targetDir}\n`);

  // Phase 1: Planning
  console.log('--- Phase 1: Planning ---');
  const domainContext = files.read(files.domainContextPath);
  const spec = await runPlanner(input, targetDir, domainContext, config);
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

    // 2-1: Contract 생성 (Planner 초안 → Evaluator 검토)
    const contractDraft = await runPlanner(
      `spec.md 기반으로 Sprint ${sprint.number} (${sprint.name})의 contract를 생성해.
범위: ${sprint.scope}
산출물: ${sprint.deliverables}

contract 형식:
- 이번 Sprint에서 만드는 것
- 하지 말아야 할 것
- 완료 기준 (정적 게이트 + 코드 품질)
- 참조할 기존 코드`,
      targetDir,
      spec,
      config,
    );

    // Evaluator가 contract 검토: "이 기준으로 평가 가능한가?"
    const reviewOutput = await runEvaluator(contractDraft, '', '', config, targetDir);
    const reviewResult = parseEvalLog(reviewOutput);

    // 검토에서 contract 수정 제안이 있으면 반영
    const contract = reviewResult.contractFeedback
      ? `${contractDraft}\n\n## Evaluator 검토에서 보완\n${reviewResult.contractFeedback}`
      : contractDraft;
    files.write(files.contractPath(sprint.number), contract);

    // 2-2 ~ 2-4: Generate + Gate + Eval 루프
    const evalHistory: EvalResult[] = [];
    let round = 0;
    let lastFeedback: string | null = null;
    let sprintPassed = false;
    let currentContract = contract;
    let lastConvergence: ReturnType<typeof checkConvergence> | null = null;

    while (round < config.limits.evalLoopRetries) {
      round++;
      console.log(`  Round ${round}:`);

      // Generate
      try {
        await runGenerator(spec, currentContract, lastFeedback, '', config, targetDir);
      } catch (e) {
        console.log(`    Generator 크래시: ${e instanceof Error ? e.message : e}`);
        sprintResults.push({
          sprintNumber: sprint.number,
          name: sprint.name,
          rounds: round,
          finalScore: evalHistory[evalHistory.length - 1]?.qualityScore ?? 0,
          result: 'stopped',
        });
        break;
      }
      // Generator 반환값 대신 git diff로 변경 파일 감지 (C2)
      const changedFiles = getChangedFiles(targetDir);
      console.log(`    Generator 완료 (${changedFiles.length}개 파일 변경)`);

      // Static Gate (재시도 포함)
      let gateResult = runStaticGate(targetDir, config.staticGate);
      let gateRetry = 0;
      while (!gateResult.passed && gateRetry < config.limits.staticGateRetries) {
        gateRetry++;
        console.log(`    Static Gate FAIL (${gateRetry}/${config.limits.staticGateRetries}): ${gateResult.errors.length}개 에러`);
        const rawErrors = gateResult.errors.join('\n');
        const MAX_ERROR_LENGTH = 3000;
        const truncatedErrors = rawErrors.length > MAX_ERROR_LENGTH
          ? rawErrors.slice(0, MAX_ERROR_LENGTH) + `\n\n... (${rawErrors.length - MAX_ERROR_LENGTH}자 생략)`
          : rawErrors;
        const errorFeedback = `Static Gate 에러를 수정해:\n${truncatedErrors}`;
        try {
          await runGenerator(spec, currentContract, errorFeedback, '', config, targetDir);
        } catch {
          console.log(`    Generator 재호출 실패 → Static Gate 재시도 중단`);
          break;
        }
        gateResult = runStaticGate(targetDir, config.staticGate);
      }
      if (!gateResult.passed) {
        console.log(`    Static Gate ${config.limits.staticGateRetries}회 실패 → Sprint 중단`);
        sprintResults.push({
          sprintNumber: sprint.number,
          name: sprint.name,
          rounds: round,
          finalScore: 0,
          result: 'stopped',
        });
        break; // for 루프의 sprintResults.push는 아래 조건문으로 스킵됨
      }
      console.log(`    Static Gate 통과`);

      // Evaluate
      let evalOutput: string;
      try {
        evalOutput = await runEvaluator(currentContract, changedFiles.join('\n'), '', config, targetDir);
      } catch (e) {
        console.log(`    Evaluator 크래시: ${e instanceof Error ? e.message : e}`);
        sprintResults.push({
          sprintNumber: sprint.number,
          name: sprint.name,
          rounds: round,
          finalScore: evalHistory[evalHistory.length - 1]?.qualityScore ?? 0,
          result: 'stopped',
        });
        break;
      }
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
      lastConvergence = checkConvergence(evalHistory);
      console.log(`    수렴 체크: ${lastConvergence.action} (${lastConvergence.reason})`);

      if (lastConvergence.action === 'accept') {
        console.log(`    수용: ${lastConvergence.reason}`);
        break;
      }
      if (lastConvergence.action === 'pivot') {
        console.log(`    방향 전환: ${lastConvergence.reason}`);
        break;
      }
      if (lastConvergence.action === 'stop') {
        console.log(`    중단: ${lastConvergence.reason}`);
        break;
      }

      // contract 수정 제안이 있으면 contract 업데이트
      if (evalResult.contractFeedback) {
        currentContract = `${currentContract}\n\n## 보완 기준 (Round ${round}에서 추가)\n${evalResult.contractFeedback}`;
        files.write(files.contractPath(sprint.number), currentContract);
        console.log(`    Contract 보완됨`);
      }

      // feedback 저장 + 다음 라운드 준비
      if (evalResult.feedback) {
        files.write(files.feedbackPath(sprint.number, round), evalResult.feedback);
        lastFeedback = evalResult.feedback;
      }
    }

    // Static Gate 실패로 이미 push된 경우 스킵
    const alreadyPushed = sprintResults.some(r => r.sprintNumber === sprint.number);
    if (!alreadyPushed) {
      sprintResults.push({
        sprintNumber: sprint.number,
        name: sprint.name,
        rounds: round,
        finalScore: evalHistory[evalHistory.length - 1]?.qualityScore ?? 0,
        result: sprintPassed ? 'pass' : (lastConvergence?.action === 'pivot' ? 'pivot' : lastConvergence?.action === 'accept' ? 'accept' : 'stopped'),
      });
    }
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
