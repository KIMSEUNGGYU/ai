/**
 * SessionStart Hook: 세션 시작 시 컨텍스트 주입
 *
 * 1. .ai/INDEX.md 존재하면 additionalContext로 주입
 * 2. .ai/active/ 파일 1개 → 내용 자동 주입 (auto-resume)
 * 3. .ai/active/ 파일 2개+ → 목록만 표시 + /resume 안내
 * 4. hq/20_me/* 전문 주입 (세컨드 브레인 — 전역 지식)
 * 5. hq/10_projects/{name}/ 주입 (세컨드 브레인 — 프로젝트 지식)
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const projectRoot = process.cwd();
const indexPath = join(projectRoot, '.ai', 'INDEX.md');
const activePath = join(projectRoot, '.ai', 'active');
const hqRoot = join(homedir(), 'hq');

// cwd → hq 프로젝트 매핑
const PROJECT_MAP = [
  // 서비스별 매핑 (더 구체적인 것이 먼저)
  { pattern: '/ishopcare-frontend/services/admin', project: 'ishopcare', sub: 'admin' },
  { pattern: '/ishopcare-frontend/services/partners', project: 'ishopcare', sub: 'partners' },
  { pattern: '/ishopcare-frontend/services/visit-admin', project: 'ishopcare', sub: 'visit-admin' },
  { pattern: '/ishopcare-frontend/services/agency', project: 'ishopcare', sub: 'agency' },
  { pattern: '/ishopcare-frontend/services/dx', project: 'ishopcare', sub: 'dx' },
  // 프로젝트 매핑
  { pattern: '/ishopcare-frontend', project: 'ishopcare' },
  { pattern: '/ishopcare-retool-server', project: 'ishopcare-server' },
  { pattern: '/dev/ai', project: 'ai' },
];
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

// ── 세컨드 브레인: 20_me/ 전문 주입 ──
const mePath = join(hqRoot, '20_me');
try {
  const meFiles = await readdir(mePath);
  for (const file of meFiles.filter(f => f.endsWith('.md'))) {
    try {
      const content = await readFile(join(mePath, file), 'utf-8');
      contextParts.push(`[second-brain] me/${file}:\n${content}`);
    } catch { /* skip */ }
  }
  messageParts.push('[second-brain] 20_me/ 로드됨');
} catch {
  // hq/20_me/ 없으면 무시
}

// ── 세컨드 브레인: 10_projects/ 프로젝트 지식 주입 ──
const cwd = resolve(projectRoot);
const matched = PROJECT_MAP.find(m => cwd.includes(m.pattern));

if (matched) {
  const projectPath = join(hqRoot, '10_projects', matched.project);
  const LOG_LINES = 20; // log.md에서 최신 N줄만

  // 프로젝트 공통 파일 주입 (context, decisions, policies 전문 + log 최신 N줄)
  for (const file of ['context.md', 'decisions.md', 'policies.md']) {
    try {
      const content = await readFile(join(projectPath, file), 'utf-8');
      if (content.trim().length > 50) { // 빈 템플릿은 스킵
        contextParts.push(`[second-brain] projects/${matched.project}/${file}:\n${content}`);
      }
    } catch { /* skip */ }
  }
  // log.md는 최신 N줄만
  try {
    const logContent = await readFile(join(projectPath, 'log.md'), 'utf-8');
    const lines = logContent.split('\n');
    const recentLines = lines.slice(0, LOG_LINES).join('\n');
    if (recentLines.trim().length > 50) {
      contextParts.push(`[second-brain] projects/${matched.project}/log.md (최신 ${LOG_LINES}줄):\n${recentLines}`);
    }
  } catch { /* skip */ }

  // 서비스 하위 폴더가 매칭되면 추가 주입
  if (matched.sub) {
    const subPath = join(projectPath, matched.sub);
    for (const file of ['context.md', 'decisions.md', 'policies.md']) {
      try {
        const content = await readFile(join(subPath, file), 'utf-8');
        if (content.trim().length > 50) {
          contextParts.push(`[second-brain] projects/${matched.project}/${matched.sub}/${file}:\n${content}`);
        }
      } catch { /* skip */ }
    }
    try {
      const logContent = await readFile(join(subPath, 'log.md'), 'utf-8');
      const lines = logContent.split('\n');
      const recentLines = lines.slice(0, LOG_LINES).join('\n');
      if (recentLines.trim().length > 50) {
        contextParts.push(`[second-brain] projects/${matched.project}/${matched.sub}/log.md (최신 ${LOG_LINES}줄):\n${recentLines}`);
      }
    } catch { /* skip */ }
  }

  messageParts.push(`[second-brain] 프로젝트 지식 로드: ${matched.project}${matched.sub ? '/' + matched.sub : ''}`);
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

