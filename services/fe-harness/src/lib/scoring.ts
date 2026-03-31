import type { EvalResult } from '../types.js';

export function parseEvalLog(content: string): EvalResult {
  const passedMatch = content.match(/통과 판정:\s*(PASS|FAIL)/);
  const scoreMatch = content.match(/품질 점수:\s*([\d.]+)\/10/);
  const directionMatch = content.match(/## 방향성\n(.+)/);

  const contractDetails: EvalResult['contractDetails'] = [];
  const contractSection = content.match(/## A\. Contract 기준\n([\s\S]*?)(?=\n## [B-Z])/);
  if (contractSection) {
    const rows = contractSection[1].match(/\|\s*\d+\s*\|.*\|.*\|.*\|/g) ?? [];
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 4) {
        contractDetails.push({
          criterion: cells[1],
          result: cells[2].toLowerCase().includes('pass') ? 'pass' : 'fail',
          reason: cells[3],
        });
      }
    }
  }

  const passed = passedMatch?.[1] === 'PASS';
  const qualityScore = parseFloat(scoreMatch?.[1] ?? '0');
  const totalCriteria = contractDetails.length || 1;
  const passedCriteria = contractDetails.filter(d => d.result === 'pass').length;

  let direction: EvalResult['direction'] = 'retry';
  if (passed) direction = 'pass';
  else if (directionMatch?.[1]?.includes('중단')) direction = 'stop';
  else if (directionMatch?.[1]?.includes('방향')) direction = 'pivot';

  // feedback 파싱: eval-log에 feedback 섹션이 포함된 경우
  const feedbackMatch = content.match(/# Sprint \d+ Feedback[\s\S]*/);
  const feedback = feedbackMatch?.[0];

  // contract 수정 제안 파싱
  const contractFeedbackMatch = content.match(/## Contract 수정 제안\n([\s\S]*?)(?=\n## |\n# |$)/);
  const contractFeedback = contractFeedbackMatch?.[1]?.trim();
  const hasContractFeedback = contractFeedback && !contractFeedback.includes('없음') && contractFeedback.length > 0;

  return {
    passed,
    qualityScore,
    contractPassRate: passedCriteria / totalCriteria,
    openEvalScore: 0,
    contrarianScore: 0,
    contractDetails,
    direction,
    feedback,
    contractFeedback: hasContractFeedback ? contractFeedback : undefined,
  };
}

export interface ConvergenceCheck {
  action: 'continue' | 'accept' | 'pivot' | 'stop';
  reason: string;
}

export function checkConvergence(history: EvalResult[]): ConvergenceCheck {
  if (history.length === 0) return { action: 'continue', reason: 'first round' };

  const latest = history[history.length - 1];
  if (latest.passed) return { action: 'continue', reason: 'passed' };

  // 악화 감지: fail 수 증가
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const prevFails = prev.contractDetails.filter(d => d.result === 'fail').length;
    const currFails = latest.contractDetails.filter(d => d.result === 'fail').length;
    if (currFails > prevFails) {
      return { action: 'pivot', reason: `fail 수 증가 (${prevFails} → ${currFails})` };
    }
  }

  // 정체 감지: 3회 연속 동일 점수
  if (history.length >= 3) {
    const last3 = history.slice(-3).map(h => h.qualityScore);
    if (last3[0] === last3[1] && last3[1] === last3[2]) {
      return { action: 'accept', reason: `3회 연속 동점 (${last3[0]})` };
    }
  }

  // 진동 감지: N ≈ N-2
  if (history.length >= 3) {
    const curr = latest.qualityScore;
    const twoAgo = history[history.length - 3].qualityScore;
    if (Math.abs(curr - twoAgo) < 0.5) {
      return { action: 'stop', reason: `진동 감지 (${twoAgo} → ... → ${curr})` };
    }
  }

  return { action: 'continue', reason: 'improving' };
}
