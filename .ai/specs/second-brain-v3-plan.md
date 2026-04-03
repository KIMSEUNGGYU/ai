# 세컨드 브레인 v3 — 컨텍스트 자동 주입 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** hq 프로젝트 지식을 플랫 구조로 전환하고, session-start.mjs가 .map.json + active frontmatter 기반으로 자동 주입하도록 개편

**Architecture:** hq/.map.json이 cwd→프로젝트 매핑 정의, session-start.mjs가 매 세션 시작 시 매핑된 프로젝트 폴더 내 전체 .md를 로드. active 파일 frontmatter `context:`로 추가 프로젝트 지정 가능.

**Tech Stack:** Node.js (ESM), JSON 설정 파일

---

## 파일 구조

| 파일 | 역할 | 변경 |
|------|------|------|
| `~/hq/.map.json` | cwd→프로젝트 매핑 설정 | 신규 생성 |
| `~/hq/10_projects/admin/` | admin 독립 프로젝트 | ishopcare/에서 이동 |
| `~/hq/10_projects/partners/` | partners 독립 프로젝트 | ishopcare/에서 이동 |
| `~/hq/10_projects/mixpanel/` | mixpanel 독립 프로젝트 | ishopcare/에서 이동 |
| `plugins/session-manager/scripts/session-start.mjs` | SessionStart hook | 전면 개편 |
| `plugins/session-manager/.claude-plugin/plugin.json` | 플러그인 메타 | 버전 0.22.0→0.23.0 |

---

### Task 1: hq/.map.json 생성

**Files:**
- Create: `~/hq/.map.json`

- [ ] **Step 1: .map.json 파일 생성**

```json
[
  { "cwd": "ishopcare-frontend/services/admin", "project": "admin" },
  { "cwd": "ishopcare-frontend/services/partners", "project": "partners" },
  { "cwd": "ishopcare-frontend/services/visit-admin", "project": "visit-admin" },
  { "cwd": "ishopcare-frontend/services/agency", "project": "agency" },
  { "cwd": "ishopcare-frontend/services/dx", "project": "dx" },
  { "cwd": "ishopcare-frontend", "project": "ishopcare" },
  { "cwd": "ishopcare-retool-server", "project": "ishopcare-server" },
  { "cwd": "dev/ai", "project": "ai" }
]
```

배열 순서 = 우선순위. 구체적인 패턴이 먼저.

- [ ] **Step 2: 검증 — JSON 파싱 확인**

Run: `node -e "console.log(JSON.parse(require('fs').readFileSync('$HOME/hq/.map.json','utf-8')).length)"`
Expected: `8`

---

### Task 2: hq 폴더 마이그레이션

**Files:**
- Move: `~/hq/10_projects/ishopcare/admin/` → `~/hq/10_projects/admin/`
- Move: `~/hq/10_projects/ishopcare/partners/` → `~/hq/10_projects/partners/`
- Move: `~/hq/10_projects/ishopcare/mixpanel/` → `~/hq/10_projects/mixpanel/`

- [ ] **Step 1: admin 독립 이동**

```bash
mv ~/hq/10_projects/ishopcare/admin ~/hq/10_projects/admin
```

- [ ] **Step 2: partners 독립 이동**

```bash
mv ~/hq/10_projects/ishopcare/partners ~/hq/10_projects/partners
```

- [ ] **Step 3: mixpanel 독립 이동**

```bash
mv ~/hq/10_projects/ishopcare/mixpanel ~/hq/10_projects/mixpanel
```

- [ ] **Step 4: 검증 — 폴더 구조 확인**

Run: `ls ~/hq/10_projects/`
Expected: `admin  ai  ishopcare  ishopcare-server  mixpanel  partners`

Run: `ls ~/hq/10_projects/ishopcare/`
Expected: `context.md  decisions.md  log.md  policies.md  이력` (admin, partners, mixpanel 없어야 함)

---

### Task 3: session-start.mjs 개편

**Files:**
- Modify: `plugins/session-manager/scripts/session-start.mjs` (전면 재작성)

- [ ] **Step 1: PROJECT_MAP 제거 + .map.json 로드 함수 추가**

`session-start.mjs` 상단의 PROJECT_MAP(라인 20-32)을 제거하고, .map.json 로드 함수로 교체:

```javascript
/**
 * SessionStart Hook: 세션 시작 시 컨텍스트 주입
 *
 * 1. .ai/INDEX.md 존재하면 additionalContext로 주입
 * 2. .ai/active/ 파일 로드 + frontmatter context: 파싱
 * 3. hq/20_me/* 전문 주입 (세컨드 브레인 — 전역 지식)
 * 4. hq/.map.json 기반 프로젝트 지식 주입 (플랫 구조)
 * 5. active context:로 추가 프로젝트 주입
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const projectRoot = process.cwd();
const indexPath = join(projectRoot, '.ai', 'INDEX.md');
const activePath = join(projectRoot, '.ai', 'active');
const hqRoot = join(homedir(), 'hq');

// .map.json에서 매핑 로드
async function loadProjectMap() {
  try {
    const raw = await readFile(join(hqRoot, '.map.json'), 'utf-8');
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

// 프로젝트 폴더 내 전체 .md 로드
async function loadProjectFiles(projectName) {
  const projectPath = join(hqRoot, '10_projects', projectName);
  const parts = [];
  try {
    const entries = await readdir(projectPath, { withFileTypes: true });
    const mdFiles = entries.filter(e => e.isFile() && e.name.endsWith('.md'));
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
```

- [ ] **Step 2: stdin 읽기 + INDEX.md + active 처리 (frontmatter 파싱 추가)**

기존 stdin/INDEX.md 로직 유지, active 처리에 frontmatter 파싱 추가:

```javascript
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
```

- [ ] **Step 3: 세컨드 브레인 주입 (20_me + 플랫 프로젝트 + active context)**

```javascript
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
```

- [ ] **Step 4: 전체 파일이 올바르게 합쳐졌는지 확인**

Run: `node --check plugins/session-manager/scripts/session-start.mjs`
Expected: 에러 없이 종료

---

### Task 4: 플러그인 버전 업데이트

**Files:**
- Modify: `plugins/session-manager/.claude-plugin/plugin.json`

- [ ] **Step 1: 버전 올리기**

`plugin.json`의 version을 `0.22.0` → `0.23.0`으로 변경.

```json
{
  "name": "session-manager",
  "description": "AI 페어 프로그래밍 context 관리 — 세션 간 맥락 유지 + 지식 영속 저장",
  "version": "0.23.0"
}
```

근거: hooks 동작 방식 변경 → minor 버전.

- [ ] **Step 2: 커밋**

```bash
git add plugins/session-manager/scripts/session-start.mjs plugins/session-manager/.claude-plugin/plugin.json
git commit -m "feat: 세컨드 브레인 v3 — 플랫 구조 + .map.json 매핑 + active frontmatter context v0.23.0"
```

---

### Task 5: 검증

- [ ] **Step 1: session-start.mjs 직접 실행 테스트**

```bash
cd ~/dev/ai && echo '{"session_id":"test-123"}' | node plugins/session-manager/scripts/session-start.mjs
```

Expected: JSON 출력에 `[second-brain] projects/ai/` 프로젝트 파일들이 포함되어야 함.

- [ ] **Step 2: .map.json 매칭 안 되는 경로 테스트**

```bash
cd /tmp && echo '{}' | node ~/dev/ai/plugins/session-manager/scripts/session-start.mjs
```

Expected: 프로젝트 지식 로드 없이 정상 출력. 에러 없음.

- [ ] **Step 3: active frontmatter context: 테스트**

임시 active 파일 생성 후 테스트:

```bash
mkdir -p /tmp/test-brain/.ai/active
cat > /tmp/test-brain/.ai/active/test-task.md << 'EOF'
---
context: [admin, mixpanel]
---
## 테스트 작업
EOF
cd /tmp/test-brain && echo '{}' | node ~/dev/ai/plugins/session-manager/scripts/session-start.mjs
```

Expected: admin, mixpanel 프로젝트 파일이 로드됨 (cwd 매칭은 없지만 context:로 로드).

- [ ] **Step 4: 임시 테스트 정리**

```bash
rm -rf /tmp/test-brain
```

- [ ] **Step 5: plugin update 안내**

플러그인 반영: `exit` 후 `claude plugin update "session-manager@gyu-plugins"` 실행 필요.
