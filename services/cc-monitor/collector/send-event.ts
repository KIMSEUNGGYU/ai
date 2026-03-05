#!/usr/bin/env node
/**
 * Claude Code hook에서 호출되는 이벤트 수집 스크립트.
 * stdin으로 JSON 이벤트를 받아 cc-monitor API 서버로 전송.
 *
 * 사용법:
 *   echo '{"session_id":"...","hook_event_name":"..."}' | node send-event.ts
 *
 * 환경변수:
 *   CC_MONITOR_URL  — API 서버 URL (기본: http://localhost:4000)
 *   CC_MONITOR_USER — 사용자 식별자 (기본: hostname:username)
 */
import { hostname, userInfo } from "node:os";
import {
  isLightTool,
  incrementCounter,
  readAndClearCounters,
} from "./tool-counter.ts";
import { parseTranscriptUsage } from "./transcript-reader.ts";
import { collectConfig } from "./config-reader.ts";

const API_URL = process.env.CC_MONITOR_URL ?? "https://cc-monitor.vercel.app";
const USER_ID =
  process.env.CC_MONITOR_USER ?? `${hostname()}:${userInfo().username}`;

async function main() {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) process.exit(0);

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const hookEvent = event.hook_event_name as string | undefined;
  const toolName = event.tool_name as string | undefined;
  const sessionId = event.session_id as string | undefined;

  // 경량 도구: 서버 전송 대신 로컬 파일 카운터로 집계
  if (
    (hookEvent === "PreToolUse" || hookEvent === "PostToolUse") &&
    toolName &&
    isLightTool(toolName)
  ) {
    if (hookEvent === "PostToolUse" && sessionId) {
      incrementCounter(sessionId, toolName);
    }
    process.exit(0);
  }

  // SessionStart 시 로컬 설정 스냅샷 첨부
  if (hookEvent === "SessionStart") {
    const cwd = event.cwd as string | undefined;
    if (cwd) {
      event.config_snapshot = collectConfig(cwd);
    }
  }

  // Stop/SessionEnd 시 카운터 요약 첨부
  if (
    (hookEvent === "Stop" || hookEvent === "SessionEnd") &&
    sessionId
  ) {
    const summary = readAndClearCounters(sessionId);
    if (summary) {
      event.tool_summary = summary;
    }

    const transcriptPath = event.transcript_path as string | undefined;
    if (transcriptPath) {
      const usage = await parseTranscriptUsage(transcriptPath);
      if (usage) {
        event.transcript_usage = usage;
      }
    }
  }

  try {
    await fetch(`${API_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-User": USER_ID,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // 서버 다운 시 silent fail — Claude Code 블로킹 방지
  }
}

main();
