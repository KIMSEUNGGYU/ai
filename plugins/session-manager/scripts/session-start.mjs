/**
 * SessionStart Hook: 세션 시작 시 컨텍스트 주입
 *
 * 1. .ai/INDEX.md 존재하면 additionalContext로 주입
 * 2. .ai/active/ 파일 로드 + frontmatter context: 파싱
 * 3. hq/20_me/* 전문 주입 (세컨드 브레인 — 전역 지식)
 * 4. hq/.map.json 기반 프로젝트 지식 주입 (플랫 구조)
 * 5. active context:로 추가 프로젝트 주입
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const projectRoot = process.cwd();
const indexPath = join(projectRoot, '.ai', 'INDEX.md');
const activePath = join(projectRoot, '.ai', 'active');
const hqRoot = join(homedir(), 'hq');

// .map.json에서 매핑 로드
async function loadProjectMap() {
  try {
    const raw = await readFile(join(hqRoot, 'map.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return []; // 파일 없거나 파싱 실패 → 빈 배열
  }
}

// cwd에서 프로젝트 매칭
function matchProject(mappings, cwd) {
  return mappings.find(m => cwd.includes(m.cwd));
}

// active 파일 frontmatter에서 context: 추출
function parseContextFromFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  const fmLine = match[1].split('\n').find(l => l.startsWith('context:'));
  if (!fmLine) return [];
  const arrMatch = fmLine.match(/context:\s*\[([^\]]*)\]/);
  if (!arrMatch) return [];
  return arrMatch[1].split(',').map(s => s.trim()).filter(Boolean);
}

// 프로젝트 폴더 내 전체 .md 로드 (log.md 제외 — 필요 시 /recap에서 읽음)
const SKIP_FILES = new Set(['log.md']);

async function loadProjectFiles(projectName) {
  const projectPath = join(hqRoot, '10_projects', projectName);
  const parts = [];
  try {
    const entries = await readdir(projectPath, { withFileTypes: true });
    const mdFiles = entries.filter(e => e.isFile() && e.name.endsWith('.md') && !SKIP_FILES.has(e.name));
    for (const file of mdFiles) {
      try {
        const content = await readFile(join(projectPath, file.name), 'utf-8');
        if (content.trim().length > 50) {
          parts.push(`[second-brain] projects/${projectName}/${file.name}:\n${content}`);
        }
      } catch { /* skip */ }
    }
  } catch { /* 폴더 없으면 무시 */ }
  return parts;
}

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

let indexContent = '';
let activeFiles = [];
let activeContextProjects = []; // frontmatter context: 값

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

const contextParts = [];
const messageParts = [];

// INDEX.md 주입
if (indexContent) {
  contextParts.push(`[session-manager] 프로젝트 컨텍스트:\n${indexContent}`);
  messageParts.push('[session-manager] INDEX.md 로드됨');
}

// active 파일 처리
if (activeFiles.length === 1) {
  const filePath = join(activePath, activeFiles[0]);
  const taskName = activeFiles[0].replace('.md', '');
  try {
    const content = await readFile(filePath, 'utf-8');
    contextParts.push(`[session-manager] 현재 작업 (${taskName}):\n${content}`);
    messageParts.push(`[session-manager] 작업 자동 복원: ${taskName}`);
    // frontmatter context: 파싱
    activeContextProjects = parseContextFromFrontmatter(content);
  } catch {
    messageParts.push(`[session-manager] 작업 파일 읽기 실패: ${taskName}`);
  }
} else if (activeFiles.length > 1) {
  const list = activeFiles.map(f => `  - ${f.replace('.md', '')}`).join('\n');
  messageParts.push(`[session-manager] 진행 중 작업 ${activeFiles.length}개:\n${list}\n→ /resume 으로 작업을 선택하세요.`);
  // 모든 active 파일의 frontmatter context: 수집
  for (const file of activeFiles) {
    try {
      const content = await readFile(join(activePath, file), 'utf-8');
      const contexts = parseContextFromFrontmatter(content);
      activeContextProjects.push(...contexts);
    } catch { /* skip */ }
  }
} else {
  messageParts.push('[session-manager] 활성 작업 없음 — 새 세션');
}

// ── 세컨드 브레인: 20_me/ 전문 주입 ──
const mePath = join(hqRoot, '20_me');
try {
  const meFiles = await readdir(mePath);
  for (const file of meFiles.filter(f => f.endsWith('.md'))) {
    try {
      const content = await readFile(join(mePath, file.name || file), 'utf-8');
      contextParts.push(`[second-brain] me/${file.name || file}:\n${content}`);
    } catch { /* skip */ }
  }
  messageParts.push('[second-brain] 20_me/ 로드됨');
} catch {
  // hq/20_me/ 없으면 무시
}

// ── 세컨드 브레인: 프로젝트 지식 주입 (플랫 구조) ──
const cwd = resolve(projectRoot);
const projectMap = await loadProjectMap();
const matched = matchProject(projectMap, cwd);
const loadedProjects = new Set(); // 중복 방지

// 1) cwd 매칭 프로젝트 로드
if (matched) {
  const parts = await loadProjectFiles(matched.project);
  contextParts.push(...parts);
  loadedProjects.add(matched.project);
  messageParts.push(`[second-brain] 프로젝트 지식 로드: ${matched.project}`);
}

// 2) active frontmatter context: 추가 프로젝트 로드
for (const project of activeContextProjects) {
  if (loadedProjects.has(project)) continue; // 이미 로드됨
  const parts = await loadProjectFiles(project);
  if (parts.length > 0) {
    contextParts.push(...parts);
    loadedProjects.add(project);
    messageParts.push(`[second-brain] 추가 프로젝트 지식 로드: ${project}`);
  }
}

// session_id를 context에 주입
if (sessionId) {
  contextParts.push(`[session-manager] session_id: ${sessionId}`);
}

const result = {};

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
