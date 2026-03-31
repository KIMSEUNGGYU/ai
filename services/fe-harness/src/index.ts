import { parseArgs } from 'node:util';
import { orchestrate } from './orchestrator.js';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    spec: { type: 'string', short: 's' },
    domain: { type: 'string', short: 'd' },
    page: { type: 'string', short: 'p' },
    target: { type: 'string', short: 't' },
  },
  allowPositionals: true,
});

const input = values.spec ?? positionals.join(' ');
if (!input) {
  console.error('Usage: pnpm fe-harness "요구사항" --domain order --page detail --target ~/work/project');
  process.exit(1);
}

await orchestrate({
  input,
  domain: values.domain ?? 'default',
  page: values.page ?? 'default',
  targetDir: values.target ?? process.cwd(),
});
