/**
 * SessionStart Hook: 세션 시작 시 .ai/INDEX.md + active/ 컨텍스트 주입
 *
 * 1. .ai/INDEX.md 존재하면 additionalContext로 주입
 * 2. .ai/active/ 파일 1개 → 내용 자동 주입 (auto-resume)
 * 3. .ai/active/ 파일 2개+ → 목록만 표시 + /resume 안내
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const projectRoot = process.cwd();
const indexPath = join(projectRoot, '.ai', 'INDEX.md');
const activePath = join(projectRoot, '.ai', 'active');
// stdin에서 hook 입력 읽기
let hookInput = {};
try {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (raw) hookInput = JSON.parse(raw);
} catch {
  // stdin 파싱 실패 시 무시
}

const sessionId = hookInput.session_id || '';
const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');


let indexContent = '';
let activeFiles = [];
// INDEX.md 읽기
try {
  indexContent = await readFile(indexPath, 'utf-8');
} catch {
  // 없으면 무시
}

// active/ 파일 목록
try {
  const files = await readdir(activePath);
  activeFiles = files.filter(f => f.endsWith('.md'));
} catch {
  // 폴더 없으면 무시
}

const result = {};
const contextParts = [];
const messageParts = [];

// INDEX.md 주입
if (indexContent) {
  contextParts.push(`[session-manager] 프로젝트 컨텍스트:\n${indexContent}`);
  messageParts.push('[session-manager] INDEX.md 로드됨');
}

// active 파일 처리
if (activeFiles.length === 1) {
  // auto-resume: 내용 자동 주입
  const filePath = join(activePath, activeFiles[0]);
  const taskName = activeFiles[0].replace('.md', '');

  try {
    const content = await readFile(filePath, 'utf-8');
    contextParts.push(`[session-manager] 현재 작업 (${taskName}):\n${content}`);
    messageParts.push(`[session-manager] 작업 자동 복원: ${taskName}`);
  } catch {
    messageParts.push(`[session-manager] 작업 파일 읽기 실패: ${taskName}`);
  }
} else if (activeFiles.length > 1) {
  const list = activeFiles.map(f => `  - ${f.replace('.md', '')}`).join('\n');
  messageParts.push(`[session-manager] 진행 중 작업 ${activeFiles.length}개:\n${list}\n→ /resume 으로 작업을 선택하세요.`);
} else {
  messageParts.push('[session-manager] 활성 작업 없음 — 새 세션');
}

// session_id를 context에 주입 → /save 시 Claude가 세션 이력에 기록
if (sessionId) {
  contextParts.push(`[session-manager] session_id: ${sessionId}`);
}

if (contextParts.length > 0) {
  result.hookSpecificOutput = {
    hookEventName: 'SessionStart',
    additionalContext: contextParts.join('\n\n---\n\n'),
  };
}

if (messageParts.length > 0) {
  result.systemMessage = messageParts.join('\n');
} else {
  result.systemMessage = '[session-manager] 새 세션';
}

console.log(JSON.stringify(result));

