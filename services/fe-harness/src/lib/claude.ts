import { query } from '@anthropic-ai/claude-agent-sdk';

interface ClaudeOptions {
  model?: 'opus' | 'sonnet';
  systemPrompt?: string;
  cwd?: string;
}

export async function callClaude(prompt: string, options: ClaudeOptions = {}): Promise<string> {
  const { model = 'opus', systemPrompt, cwd } = options;

  // 중첩 세션 방지 (Ouroboros 패턴)
  delete process.env.CLAUDECODE;

  let result = '';

  try {
    for await (const message of query({
      prompt,
      options: {
        model: model as 'opus' | 'sonnet',
        permissionMode: 'bypassPermissions' as const,
        allowDangerouslySkipPermissions: true,
        ...(systemPrompt ? { systemPrompt } : {}),
        ...(cwd ? { cwd } : {}),
      },
    })) {
      const msg = message as Record<string, unknown>;
      if (msg.type === 'result') {
        result = (msg.result as string) ?? '';
      }
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`    Claude 호출 실패: ${errMsg}`);
    if (result) return result.trim();
    throw error;
  }

  return result.trim();
}
