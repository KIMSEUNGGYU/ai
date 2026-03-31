import { execSync } from 'node:child_process';

interface GateResult {
  passed: boolean;
  errors: string[];
}

export function runStaticGate(cwd: string, commands: string[]): GateResult {
  const errors: string[] = [];

  for (const cmd of commands) {
    try {
      execSync(cmd, { cwd, stdio: 'pipe', timeout: 60000 });
    } catch (e: unknown) {
      const error = e as { stderr?: Buffer; stdout?: Buffer };
      const stderr = error.stderr?.toString() ?? '';
      const stdout = error.stdout?.toString() ?? '';
      errors.push(`[${cmd}]\n${stderr || stdout}`);
    }
  }

  return { passed: errors.length === 0, errors };
}
