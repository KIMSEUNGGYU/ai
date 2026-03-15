import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * 서버 전송이 필요한 특수 도구 (Analysis 탭에서 사용).
 * 이 외의 일반 도구(Read, Edit, Bash 등)는 로컬 카운터로 집계.
 */
const SERVER_REQUIRED_TOOLS = new Set(["Skill", "Agent"]);

/** MCP/플러그인 도구는 서버 전송 필요 */
function isMcpOrPlugin(toolName: string): boolean {
  return toolName.startsWith("mcp__") || toolName.includes(":");
}

export function isServerRequired(toolName: string): boolean {
  return SERVER_REQUIRED_TOOLS.has(toolName) || isMcpOrPlugin(toolName);
}

function getCachePath(sessionId: string): string {
  return path.join(os.tmpdir(), `cc-monitor-${sessionId}.json`);
}

export function incrementCounter(sessionId: string, toolName: string): void {
  const cachePath = getCachePath(sessionId);
  let counters: Record<string, number> = {};

  try {
    if (fs.existsSync(cachePath)) {
      counters = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    }
  } catch {
    counters = {};
  }

  counters[toolName] = (counters[toolName] ?? 0) + 1;
  fs.writeFileSync(cachePath, JSON.stringify(counters), "utf-8");
}

export function readAndClearCounters(
  sessionId: string,
): Record<string, number> | null {
  const cachePath = getCachePath(sessionId);
  try {
    if (!fs.existsSync(cachePath)) return null;
    const counters = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    fs.unlinkSync(cachePath);
    return counters;
  } catch {
    return null;
  }
}
