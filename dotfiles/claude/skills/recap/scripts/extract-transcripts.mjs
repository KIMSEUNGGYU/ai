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

// 스킬 프롬프트 감지: <command-message>에서 스킬명과 args를 추출
function parseCommandMessage(content) {
  if (typeof content !== "string") return null;
  const nameMatch = content.match(/<command-name>\/?(.*?)<\/command-name>/);
  const argsMatch = content.match(/<command-args>([\s\S]*?)<\/command-args>/);
  if (!nameMatch) return null;
  return {
    skillName: nameMatch[1],
    args: argsMatch ? argsMatch[1].trim() : "",
  };
}

// tool_result에서 "Launching skill: xxx" 감지
function parseLaunchingSkill(content) {
  if (!Array.isArray(content)) return null;
  for (const c of content) {
    if (c.type === "tool_result") {
      const text =
        typeof c.content === "string"
          ? c.content
          : Array.isArray(c.content)
            ? c.content.map((x) => x.text || "").join("")
            : "";
      const match = text.match(/Launching skill:\s*(.+)/);
      if (match) return match[1].trim();
    }
  }
  return null;
}

// 스킬 프롬프트 본문 감지 (Base directory for this skill:)
function isSkillBody(text) {
  return text.startsWith("Base directory for this skill:");
}

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
    let skipNextUserText = false; // 스킬 본문 스킵 플래그

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

        // string content: <command-message> 패턴 감지
        if (typeof content === "string") {
          const cmd = parseCommandMessage(content);
          if (cmd) {
            skipNextUserText = true;
            // 스킬 호출을 한 줄로 출력
            const argsText = cmd.args ? ` ${cmd.args}` : "";
            messages.push({
              role: "user",
              time: msgTime,
              text: `[/${cmd.skillName}]${argsText}`,
            });
          }
          continue;
        }

        if (!Array.isArray(content)) continue;

        // tool_result에서 "Launching skill" 감지
        const launchedSkill = parseLaunchingSkill(content);
        if (launchedSkill) {
          skipNextUserText = true;
          continue;
        }

        for (const c of content) {
          if (c?.type !== "text") continue;
          const text = c.text;
          if (NOISE_PREFIXES.some((p) => text.startsWith(p))) continue;
          if (SKIP_TEXTS.includes(text.trim())) continue;

          // 스킬 본문 스킵: 이전 라인이 커맨드 호출이었으면 건너뜀
          if (skipNextUserText) {
            skipNextUserText = false;
            // "Base directory for this skill:" 패턴도 확인
            if (isSkillBody(text) || text.length > 1000) {
              // ARGUMENTS 라인이 있으면 추출
              const argsMatch = text.match(/\nARGUMENTS:\s*(.+)/);
              if (argsMatch) {
                messages.push({
                  role: "user",
                  time: msgTime,
                  text: `  args: ${argsMatch[1].trim()}`,
                });
              }
              continue;
            }
            // 짧은 텍스트면 스킬 본문이 아님 — 정상 처리
          }

          // "Base directory for this skill:" 단독 감지 (플래그 없이도)
          if (isSkillBody(text)) {
            const nameMatch = text.match(
              /^Base directory for this skill:.*?skills\/([^/\n]+)/
            );
            const skillName = nameMatch ? nameMatch[1] : "unknown";
            const argsMatch = text.match(/\nARGUMENTS:\s*(.+)/);
            const argsText = argsMatch ? ` ${argsMatch[1].trim()}` : "";
            messages.push({
              role: "user",
              time: msgTime,
              text: `[/${skillName}]${argsText}`,
            });
            continue;
          }

          messages.push({ role: "user", time: msgTime, text });
        }
      } else if (d.type === "assistant") {
        skipNextUserText = false; // assistant 응답이 오면 플래그 리셋
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
      const text = m.text;
      const indented = text.replaceAll("\n", "\n  ");
      console.log(`\n[${m.time}] ${roleIcon}:`);
      console.log(`  ${indented}`);
    }
  }
}
