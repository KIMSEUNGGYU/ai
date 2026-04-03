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

  // B. 열린 평가 점수 파싱 — 가장 심각한 이슈의 값 적용
  const openEvalScore = parseSeverityScore(content, /## B\. 열린 평가\n([\s\S]*?)(?=\n## [C-Z])/);

  // C. Contrarian 점수 파싱 — 가장 심각한 약점의 값 적용
  const contrarianScore = parseSeverityScore(content, /## C\. Contrarian\n([\s\S]*?)(?=\n## [D-Z])/);

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
    openEvalScore,
    contrarianScore,
    contractDetails,
    direction,
    feedback,
    contractFeedback: hasContractFeedback ? contractFeedback : undefined,
  };
}

/**
 * 섹션에서 심각도를 파싱하여 가장 심각한 값을 반환.
 * 심각(0.5), 중간(0.7/0.6), 경미(0.85/0.8) 패턴을 찾음.
 * 이슈가 없으면 1.0 반환.
 */
function parseSeverityScore(content: string, sectionRegex: RegExp): number {
  const section = content.match(sectionRegex);
  if (!section) return 1.0;

  const sectionText = section[1];
  const severityPattern = /\[(심각|중간|경미)\]/g;
  const severityMap: Record<string, number> = {
    '심각': 0.5,
    '중간': 0.65, // B의 0.7과 C의 0.6 평균 — 실제로는 섹션별로 다르지만 파싱 시점에 충분
    '경미': 0.825,
  };

  let worstScore = 1.0;
  let match;
  while ((match = severityPattern.exec(sectionText)) !== null) {
    const score = severityMap[match[1]] ?? 1.0;
    if (score < worstScore) worstScore = score;
  }

  return worstScore;
}

// --- 수렴 감지 ---

const SCORE_TOO_LOW = 5.0;
const DELTA_THRESHOLD = 0.3;

export interface ConvergenceCheck {
  action: 'continue' | 'accept' | 'pivot' | 'stop';
  reason: string;
}

export function checkConvergence(history: EvalResult[]): ConvergenceCheck {
  if (history.length === 0) return { action: 'continue', reason: '첫 라운드' };

  const latest = history[history.length - 1];

  // 통과하면 계속
  if (latest.passed) return { action: 'continue', reason: '통과' };

  // 점수가 너무 낮으면 방향 전환
  if (latest.qualityScore < SCORE_TOO_LOW) {
    return { action: 'pivot', reason: `점수 너무 낮음 (${latest.qualityScore})` };
  }

  // 첫 라운드는 개선폭 비교 불가
  if (history.length < 2) return { action: 'continue', reason: '기준점 수집 중' };

  // 개선폭 계산
  const prev = history[history.length - 2];
  const delta = latest.qualityScore - prev.qualityScore;

  // 개선폭이 크면 계속
  if (delta >= DELTA_THRESHOLD) {
    return { action: 'continue', reason: `개선 중 (Δ${delta.toFixed(1)})` };
  }

  // 개선폭이 미미하면 멈춤 (결과물은 가져감)
  return { action: 'accept', reason: `개선폭 미미 (Δ${delta.toFixed(1)})` };
}
