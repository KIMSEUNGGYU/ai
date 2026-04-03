import { readFileSync } from 'node:fs';
import { callClaude } from '../lib/claude.js';
import type { HarnessConfig } from '../types.js';

export async function runGenerator(
  spec: string,
  contract: string,
  feedback: string | null,
  referenceCode: string,
  config: HarnessConfig,
): Promise<string> {
  const conventionContents = config.conventions
    .map(path => {
      try { return `--- ${path} ---\n${readFileSync(path, 'utf-8')}\n--- end ---`; }
      catch { return ''; }
    })
    .filter(Boolean)
    .join('\n\n');

  const systemPrompt = `너는 FE 하네스의 Generator다.

## 원칙
- contract에 없는 건 안 만든다. "하지 말아야 할 것"을 반드시 확인.
- 기존 코드 패턴을 따른다.
- Sprint 범위만 구현한다.

## 컨벤션
${conventionContents}`;

  const feedbackSection = feedback
    ? `\n## Evaluator 피드백 (이것만 보고 수정)\n${feedback}`
    : '';

  const prompt = `## 전체 스펙 (맥락용)
${spec}

## 이번 Sprint Contract (이것이 이번 작업의 전부)
${contract}

## 참조 코드 (이 패턴을 따라)
${referenceCode}
${feedbackSection}

## 지시
contract의 "이번 Sprint에서 만드는 것" 항목을 구현해.
코드만 출력. 파일 경로와 전체 내용을 포함해.`;

  return callClaude(prompt, { model: 'opus', systemPrompt });
}
