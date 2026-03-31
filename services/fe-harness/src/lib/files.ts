import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export class HarnessFiles {
  private baseDir: string;

  constructor(targetDir: string, domain: string, page: string) {
    this.baseDir = join(targetDir, '.ai', 'harness', domain, page);
    mkdirSync(this.baseDir, { recursive: true });
  }

  get specPath(): string {
    return join(this.baseDir, 'spec.md');
  }

  sprintDir(n: number): string {
    const dir = join(this.baseDir, `sprint-${n}`);
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  contractPath(sprint: number): string {
    return join(this.sprintDir(sprint), 'contract.md');
  }

  evalLogPath(sprint: number, round: number): string {
    return join(this.sprintDir(sprint), `eval-log-r${round}.md`);
  }

  feedbackPath(sprint: number, round: number): string {
    return join(this.sprintDir(sprint), `feedback-r${round}.md`);
  }

  get summaryPath(): string {
    return join(this.baseDir, 'summary.md');
  }

  get domainContextPath(): string {
    return join(this.baseDir, '..', 'domain-context.md');
  }

  write(path: string, content: string): void {
    writeFileSync(path, content, 'utf-8');
  }

  read(path: string): string | null {
    return existsSync(path) ? readFileSync(path, 'utf-8') : null;
  }
}
