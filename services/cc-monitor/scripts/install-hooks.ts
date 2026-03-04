#!/usr/bin/env node
/**
 * Claude Code settings.json에 cc-monitor hook을 자동 설치하는 스크립트.
 * 기존 hooks 설정을 보존하면서 cc-monitor용 hook을 추가.
 *
 * 사용법: node scripts/install-hooks.ts
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
const COLLECTOR_PATH = path.resolve(
  import.meta.dirname ?? process.cwd(),
  "..",
  "collector",
  "send-event.ts"
);

const HOOK_EVENTS = [
  "SessionStart",
  "SessionEnd",
  "PreToolUse",
  "PostToolUse",
  "UserPromptSubmit",
  "Stop",
] as const;

function makeHookEntry() {
  return {
    matcher: "",
    hooks: [
      {
        type: "command" as const,
        command: `node ${COLLECTOR_PATH}`,
        timeout: 5,
      },
    ],
  };
}

function main() {
  let settings: Record<string, unknown> = {};

  if (fs.existsSync(SETTINGS_PATH)) {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    settings = JSON.parse(raw);
    // 백업
    fs.writeFileSync(`${SETTINGS_PATH}.backup`, raw, "utf-8");
    console.log(`백업 생성: ${SETTINGS_PATH}.backup`);
  }

  const hooks = (settings.hooks ?? {}) as Record<string, unknown[]>;

  for (const event of HOOK_EVENTS) {
    const existing = hooks[event] ?? [];

    // 이미 cc-monitor hook이 있는지 확인
    const alreadyInstalled = (existing as Array<{ hooks?: Array<{ command?: string }> }>).some(
      (entry) =>
        entry.hooks?.some((h) => h.command?.includes("send-event"))
    );

    if (alreadyInstalled) {
      console.log(`[${event}] 이미 설치됨 — 스킵`);
      continue;
    }

    hooks[event] = [...existing, makeHookEntry()];
    console.log(`[${event}] hook 추가됨`);
  }

  settings.hooks = hooks;
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
  console.log(`\n설정 저장 완료: ${SETTINGS_PATH}`);
  console.log("Claude Code를 재시작하면 모니터링이 시작됩니다.");
}

main();
