import { query } from '@anthropic-ai/claude-agent-sdk';

interface ClaudeOptions {
  model?: 'opus' | 'sonnet';
  systemPrompt?: string;
}

export async function callClaude(prompt: string, options: ClaudeOptions = {}): Promise<string> {
  const { model = 'sonnet', systemPrompt } = options;

  let result = '';

  for await (const message of query({
    prompt,
    options: {
      model: model as 'opus' | 'sonnet',
      permissionMode: 'bypassPermissions' as const,
      allowDangerouslySkipPermissions: true,
      ...(systemPrompt ? { systemPrompt } : {}),
    },
  })) {
    const msg = message as Record<string, unknown>;
    if (msg.type === 'result') {
      result = (msg.result as string) ?? '';
    }
  }

  return result.trim();
}
