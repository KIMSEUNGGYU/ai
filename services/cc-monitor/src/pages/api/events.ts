// ── POST /api/events — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import type { HookEvent } from "@/lib/types";
import { processEvent } from "@/lib/event-processor";
import { insertEvent, upsertSession, calcToolDuration, getSessionTranscriptPath, updateSessionTokens } from "@/lib/queries";
import { parseTranscriptUsage } from "@/lib/transcript-parser";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body as HookEvent;

    if (!event.session_id || !event.hook_event_name) {
      return res.status(400).json({ error: "session_id and hook_event_name required" });
    }

    const userId =
      (req.headers["x-cc-user"] as string) ??
      extractUserFromCwd(event.cwd) ??
      "unknown";

    const stored = processEvent(event, userId);
    insertEvent(stored);

    // PostToolUse: Pre→Post duration 계산
    if (event.hook_event_name === "PostToolUse" && stored.tool_use_id) {
      calcToolDuration(stored.tool_use_id, stored.timestamp);
    }

    if (event.hook_event_name === "SessionStart") {
      upsertSession({
        session_id: event.session_id,
        user_id: userId,
        project_path: event.cwd,
        model: "model" in event && typeof event.model === "string" ? event.model : null,
        permission_mode: event.permission_mode ?? null,
        started_at: stored.timestamp,
        status: "active",
      });
    } else if (event.hook_event_name === "Stop") {
      const transcriptPath = "transcript_path" in event && typeof event.transcript_path === "string"
        ? event.transcript_path
        : null;
      if (transcriptPath) {
        upsertSession({
          session_id: event.session_id,
          transcript_path: transcriptPath,
        });
        // 비동기로 transcript 파싱 (응답 블로킹 안 함)
        parseTranscriptUsage(transcriptPath).then((usage) => {
          if (usage) {
            updateSessionTokens(event.session_id, {
              total_input_tokens: usage.input_tokens,
              total_output_tokens: usage.output_tokens,
              total_cache_create_tokens: usage.cache_create_tokens,
              total_cache_read_tokens: usage.cache_read_tokens,
              num_turns: usage.num_turns,
            });
          }
        }).catch(() => {});
      }
    } else if (event.hook_event_name === "SessionEnd") {
      upsertSession({
        session_id: event.session_id,
        ended_at: stored.timestamp,
        status: "ended",
      });
      // SessionEnd에서도 transcript 파싱 시도 (Stop 이전에 종료될 수 있음)
      const tp = getSessionTranscriptPath(event.session_id);
      if (tp) {
        parseTranscriptUsage(tp).then((usage) => {
          if (usage) {
            updateSessionTokens(event.session_id, {
              total_input_tokens: usage.input_tokens,
              total_output_tokens: usage.output_tokens,
              total_cache_create_tokens: usage.cache_create_tokens,
              total_cache_read_tokens: usage.cache_read_tokens,
              num_turns: usage.num_turns,
            });
          }
        }).catch(() => {});
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[cc-monitor] Event processing error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function extractUserFromCwd(cwd: string): string | null {
  const match = cwd.match(/\/Users\/([^/]+)\//);
  return match ? match[1] : null;
}
