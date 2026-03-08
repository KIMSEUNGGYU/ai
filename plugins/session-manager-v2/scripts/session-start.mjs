/**
 * SessionStart Hook: 이전 세션 컨텍스트를 자동 주입
 *
 * 동작:
 * 1. {cwd}/.ai/last-session-id 읽기
 *    → 있으면: 해당 sessionId.jsonl 로드
 *    → 없으면: fallback — 가장 최근 JSONL 파일 (mtime 기준)
 *    → 둘 다 없으면: 빈 결과 (새 프로젝트)
 * 2. jsonl-parser.mjs로 앞 15 + 뒤 15 메시지 추출
 * 3. additionalContext로 inject
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { extractContext } from './utils/jsonl-parser.mjs';

const N = 15;
const projectRoot = process.cwd();
const projectKey = projectRoot.replace(/\//g, '-');
const claudeProjectsDir = join(homedir(), '.claude', 'projects', projectKey);
const lastSessionIdPath = join(projectRoot, '.ai', 'last-session-id');

async function findJsonlPath(sessionId) {
  return join(claudeProjectsDir, `${sessionId}.jsonl`);
}

async function findLatestJsonl() {
  let entries;
  try {
    entries = await readdir(claudeProjectsDir);
  } catch {
    return null;
  }

  const jsonlFiles = entries.filter((e) => e.endsWith('.jsonl'));
  if (jsonlFiles.length === 0) return null;

  const withStat = await Promise.all(
    jsonlFiles.map(async (name) => {
      const fullPath = join(claudeProjectsDir, name);
      const s = await stat(fullPath);
      return { name, mtime: s.mtimeMs };
    })
  );
  withStat.sort((a, b) => b.mtime - a.mtime);

  return join(claudeProjectsDir, withStat[0].name);
}

async function main() {
  const result = {};

  // 1. sessionId 읽기 시도
  let jsonlPath = null;
  let sessionId = null;
  let source = '';

  try {
    sessionId = (await readFile(lastSessionIdPath, 'utf-8')).trim();
    if (sessionId) {
      jsonlPath = await findJsonlPath(sessionId);
      // 파일 존재 확인
      await stat(jsonlPath);
      source = `session: ${sessionId.slice(0, 8)}…`;
    }
  } catch {
    // last-session-id 없거나 파일 없으면 fallback
    jsonlPath = await findLatestJsonl();
    if (jsonlPath) {
      sessionId = basename(jsonlPath, '.jsonl');
      source = `latest: ${sessionId.slice(0, 8)}… (fallback)`;
    }
  }

  if (!jsonlPath) {
    // 세션 없음 — 새 프로젝트
    result.systemMessage = '[session-manager-v2] 이전 세션 없음 — 새 프로젝트';
    console.log(JSON.stringify(result));
    return;
  }

  // 2. JSONL 파싱
  let context = '';
  try {
    context = await extractContext(jsonlPath, N);
  } catch {
    result.systemMessage = `[session-manager-v2] JSONL 파싱 실패 (${source})`;
    console.log(JSON.stringify(result));
    return;
  }

  if (!context) {
    result.systemMessage = `[session-manager-v2] 이전 세션 메시지 없음 (${source})`;
    console.log(JSON.stringify(result));
    return;
  }

  // 3. 컨텍스트 inject
  result.hookSpecificOutput = {
    hookEventName: 'SessionStart',
    additionalContext: `[session-manager-v2] 이전 작업 컨텍스트:\n\n${context}`,
  };
  result.systemMessage = `[session-manager-v2] 이전 세션 자동 로드 (${source})`;

  console.log(JSON.stringify(result));
}

main().catch(() => {
  // 실패해도 조용히 (빈 결과)
  console.log(JSON.stringify({}));
});
