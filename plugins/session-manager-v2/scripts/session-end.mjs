/**
 * SessionEnd Hook: 현재 세션 ID를 .ai/last-session-id에 저장
 *
 * 동작:
 * 1. cwd → projectKey 변환 (/ → -)
 * 2. ~/.claude/projects/{key}/ 에서 가장 최신 .jsonl 파일 찾기
 *    → SessionEnd 시점 = 현재 세션 파일이 가장 최근 mtime
 * 3. 파일명에서 sessionId 추출
 * 4. {cwd}/.ai/last-session-id 에 저장
 *
 * fire-and-forget: stdout 없음 (Claude 턴 없음)
 */

import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

const projectRoot = process.cwd();
const projectKey = projectRoot.replace(/\//g, '-');
const claudeProjectsDir = join(homedir(), '.claude', 'projects', projectKey);
const aiDir = join(projectRoot, '.ai');
const outputPath = join(aiDir, 'last-session-id');

try {
  // .jsonl 파일 목록 + mtime 정렬
  const entries = await readdir(claudeProjectsDir);
  const jsonlFiles = entries.filter((e) => e.endsWith('.jsonl'));

  if (jsonlFiles.length === 0) {
    process.exit(0);
  }

  // mtime 기준 정렬 → 가장 최신 파일 = 현재 세션
  const withStat = await Promise.all(
    jsonlFiles.map(async (name) => {
      const fullPath = join(claudeProjectsDir, name);
      const s = await stat(fullPath);
      return { name, mtime: s.mtimeMs };
    })
  );
  withStat.sort((a, b) => b.mtime - a.mtime);

  const latestFile = withStat[0].name;
  const sessionId = basename(latestFile, '.jsonl');

  // .ai/ 디렉토리 없으면 생성
  await mkdir(aiDir, { recursive: true });
  await writeFile(outputPath, sessionId, 'utf-8');
} catch {
  // 실패해도 조용히 종료 (fire-and-forget)
}
