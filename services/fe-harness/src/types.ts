export interface HarnessConfig {
  conventions: string[];
  staticGate: string[];
  scoring: {
    qualityThreshold: number;
    contractWeight: number;
    openEvalWeight: number;
    contrarianWeight: number;
  };
  limits: {
    staticGateRetries: number;
    evalLoopRetries: number;
  };
}

export interface SprintPlan {
  number: number;
  name: string;
  scope: string;
  deliverables: string;
}

export interface EvalResult {
  passed: boolean;
  qualityScore: number;
  contractPassRate: number;
  openEvalScore: number;
  contrarianScore: number;
  contractDetails: Array<{
    criterion: string;
    result: 'pass' | 'fail';
    reason: string;
  }>;
  direction: 'pass' | 'retry' | 'pivot' | 'stop';
  feedback?: string;
}

export interface SprintResult {
  sprintNumber: number;
  name: string;
  rounds: number;
  finalScore: number;
  result: 'pass' | 'stagnation' | 'stopped';
}

export interface OrchestrateOptions {
  input: string;
  domain: string;
  page: string;
  targetDir: string;
}
