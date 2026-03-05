import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const LIGHT_TOOLS = new Set(["Read", "Edit", "Glob", "Grep", "Write"]);

export function isLightTool(toolName: string): boolean {
  return LIGHT_TOOLS.has(toolName);
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
