import { execSync } from 'node:child_process';

interface ClaudeOptions {
  model?: 'opus' | 'sonnet';
  timeout?: number;
  cwd?: string;
}

export function callClaude(prompt: string, options: ClaudeOptions = {}): string {
  const { model = 'sonnet', timeout = 300000, cwd } = options;

  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  const result = execSync(
    `claude -p --model ${model} '${escapedPrompt}'`,
    { timeout, cwd, stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 },
  );

  return result.toString('utf-8').trim();
}

export function callClaudeWithFiles(
  prompt: string,
  files: Record<string, string>,
  options: ClaudeOptions = {},
): string {
  const fileContext = Object.entries(files)
    .map(([name, content]) => `--- ${name} ---\n${content}\n--- end ${name} ---`)
    .join('\n\n');

  const fullPrompt = `${fileContext}\n\n${prompt}`;
  return callClaude(fullPrompt, options);
}
