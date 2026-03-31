import { readFileSync } from 'node:fs';
import { callClaude } from '../lib/claude.js';
import type { HarnessConfig } from '../types.js';

export function runPlanner(
  input: string,
  targetDir: string,
  domainContext: string | null,
  config: HarnessConfig,
): string {
  const conventionContents = config.conventions
    .map(path => {
      try { return `--- ${path} ---\n${readFileSync(path, 'utf-8')}\n--- end ---`; }
      catch { return ''; }
    })
    .filter(Boolean)
    .join('\n\n');

  const prompt = `너는 FE 하네스의 Planner다.

## 역할
사용자의 요구사항을 전체 제품 스펙으로 확장하고 Sprint으로 분해.

## 원칙
- "무엇"만 정의. "어떻게"는 Generator에게.
- 기술 구현 디테일(훅, 상태 관리 등)을 정하지 않는다.

## 컨벤션
${conventionContents}

## 도메인 컨텍스트
${domainContext ?? '(없음 — 이 도메인의 첫 페이지)'}

## 요구사항
${input}

## 출력 형식
아래 필수 항목을 모두 포함하는 스펙을 작성해:
- 기능 목록 (구체적, "등등" 금지)
- UI 구조
- API 매핑
- 데이터 흐름
- 엣지 케이스
- 기존 코드와의 관계
- Sprint 계획 (의존성 순서, 범위, 산출물)

각 Sprint은 아래 형식으로:
### Sprint N: 이름
  범위: ...
  산출물: ...

스펙만 출력. 다른 말 하지 마.`;

  return callClaude(prompt, { model: 'opus', cwd: targetDir });
}
