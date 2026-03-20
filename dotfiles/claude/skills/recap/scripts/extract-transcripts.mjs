#!/usr/bin/env node

/**
 * Claude Code transcript에서 대상 날짜의 user/assistant 메시지를 추출한다.
 * Usage: node extract-transcripts.mjs [YYYY-MM-DD]
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename, dirname } from "path";
import { homedir } from "os";
import { globSync } from "fs";

const KST_OFFSET = 9 * 60 * 60 * 1000;

function toKST(isoString) {
  const utc = new Date(isoString);
  return new Date(utc.getTime() + KST_OFFSET);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(date) {
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// 날짜 결정
const yesterday = new Date(Date.now() + KST_OFFSET - 86400000);
const targetDate =
  process.argv[2] || formatDate(yesterday);

const projectsDir = join(homedir(), ".claude", "projects");
const username = basename(homedir());

console.log(`=== ${targetDate} transcript 추출 ===\n`);

// 모든 프로젝트 디렉토리 스캔
let projectDirs;
try {
  projectDirs = readdirSync(projectsDir, { withFileTypes: true }).filter((d) =>
    d.isDirectory()
  );
} catch {
  console.error("~/.claude/projects/ 디렉토리를 읽을 수 없습니다.");
  process.exit(1);
}

const NOISE_PREFIXES = [
  "<command-",
  "<system-reminder>",
  "SessionStart",
  "<local-command",
];
const SKIP_TEXTS = ["", "[Request interrupted by user]"];

for (const dir of projectDirs) {
  if (dir.name.includes("ClaudeProbe")) continue;

  const projPath = join(projectsDir, dir.name);
  const projName = dir.name
    .replace(`-Users-${username}-`, "~/")
    .replaceAll("-", "/");

  // .jsonl 파일 찾기
  let jsonlFiles;
  try {
    jsonlFiles = readdirSync(projPath).filter((f) => f.endsWith(".jsonl"));
  } catch {
    continue;
  }

  for (const jsonlFile of jsonlFiles) {
    const filePath = join(projPath, jsonlFile);
    const sessionId = jsonlFile.replace(".jsonl", "").slice(0, 8);

    let lines;
    try {
      lines = readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
    } catch {
      continue;
    }

    const messages = [];

    for (const line of lines) {
      let d;
      try {
        d = JSON.parse(line);
      } catch {
        continue;
      }

      const ts = d.timestamp;
      if (!ts) continue;

      const kst = toKST(ts);
      const msgDate = formatDate(kst);
      const msgTime = formatTime(kst);

      if (msgDate !== targetDate) continue;

      if (d.type === "user") {
        const content = d.message?.content;
        if (!Array.isArray(content)) continue;
        for (const c of content) {
          if (c?.type !== "text") continue;
          const text = c.text;
          if (NOISE_PREFIXES.some((p) => text.startsWith(p))) continue;
          if (SKIP_TEXTS.includes(text.trim())) continue;
          messages.push({ role: "user", time: msgTime, text });
        }
      } else if (d.type === "assistant") {
        const content = d.message?.content;
        if (!Array.isArray(content)) continue;
        for (const c of content) {
          if (c?.type !== "text") continue;
          messages.push({ role: "assistant", time: msgTime, text: c.text });
        }
      }
    }

    if (messages.length === 0) continue;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`PROJECT: ${projName} | SESSION: ${sessionId}`);
    console.log("=".repeat(60));

    for (const m of messages) {
      const roleIcon = m.role === "user" ? "USER" : "AI";
      // 응답은 1500자로 제한 (판단 맥락 보존)
      const text =
        m.text.length > 1500 ? m.text.slice(0, 1500) + "..." : m.text;
      const indented = text.replaceAll("\n", "\n  ");
      console.log(`\n[${m.time}] ${roleIcon}:`);
      console.log(`  ${indented}`);
    }
  }
}
