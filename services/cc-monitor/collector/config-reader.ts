import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ConfigSnapshot {
  claude_md_count: number;
  claude_md_paths: string[];
  rules_count: number;
  rules_names: string[];
  mcp_count: number;
  mcp_names: string[];
  hooks_count: number;
  hooks_events: string[];
  active_task: string | null;
}

export function collectConfig(cwd: string): ConfigSnapshot {
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, ".claude");
  const result: ConfigSnapshot = {
    claude_md_count: 0,
    claude_md_paths: [],
    rules_count: 0,
    rules_names: [],
    mcp_count: 0,
    mcp_names: [],
    hooks_count: 0,
    hooks_events: [],
    active_task: null,
  };

  // CLAUDE.md 파일들
  const claudeMdCandidates = [
    path.join(claudeDir, "CLAUDE.md"),
    path.join(cwd, "CLAUDE.md"),
    path.join(cwd, "CLAUDE.local.md"),
    path.join(cwd, ".claude", "CLAUDE.md"),
    path.join(cwd, ".claude", "CLAUDE.local.md"),
  ];
  for (const p of claudeMdCandidates) {
    if (fs.existsSync(p)) {
      result.claude_md_count++;
      result.claude_md_paths.push(p.replace(homeDir, "~"));
    }
  }

  // rules
  for (const rulesDir of [path.join(claudeDir, "rules"), path.join(cwd, ".claude", "rules")]) {
    if (fs.existsSync(rulesDir)) {
      const files = collectMdFiles(rulesDir);
      result.rules_count += files.length;
      result.rules_names.push(...files);
    }
  }

  // MCP servers — 여러 설정 파일에서 mcpServers 키 읽기
  const mcpNames = new Set<string>();
  for (const mcpFile of [
    path.join(claudeDir, "settings.json"),
    path.join(homeDir, ".claude.json"),
    path.join(cwd, ".mcp.json"),
    path.join(cwd, ".claude", "settings.json"),
    path.join(cwd, ".claude", "settings.local.json"),
  ]) {
    for (const name of readJsonObjectKeys(mcpFile, "mcpServers")) {
      mcpNames.add(name);
    }
  }
  result.mcp_names = [...mcpNames];
  result.mcp_count = mcpNames.size;

  // Hooks — settings.json의 hooks 키에서 이벤트명 수집
  const hooksEvents = new Set<string>();
  for (const settingsFile of [
    path.join(claudeDir, "settings.json"),
    path.join(cwd, ".claude", "settings.json"),
    path.join(cwd, ".claude", "settings.local.json"),
  ]) {
    for (const name of readJsonObjectKeys(settingsFile, "hooks")) {
      hooksEvents.add(name);
    }
  }
  result.hooks_events = [...hooksEvents];
  result.hooks_count = hooksEvents.size;

  // .ai/active/ 에서 현재 활성 task 읽기 (가장 최근 수정 파일)
  result.active_task = readActiveTask(cwd);

  return result;
}

function collectMdFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        results.push(...collectMdFiles(path.join(dir, entry.name)));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(entry.name);
      }
    }
  } catch { /* ignore */ }
  return results;
}

function readActiveTask(cwd: string): string | null {
  const activeDir = path.join(cwd, ".ai", "active");
  try {
    if (!fs.existsSync(activeDir)) return null;
    const files = fs.readdirSync(activeDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({
        name: f.replace(/\.md$/, ""),
        mtime: fs.statSync(path.join(activeDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);
    return files.length > 0 ? files[0].name : null;
  } catch { return null; }
}

function readJsonObjectKeys(filePath: string, key: string): string[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const obj = content[key];
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return Object.keys(obj);
    }
  } catch { /* ignore */ }
  return [];
}
