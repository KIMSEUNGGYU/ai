// ── POST /api/events — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import type { HookEvent } from "@/lib/types";
import { processEvent } from "@/lib/event-processor";
import { insertEvent, upsertSession, calcToolDuration, getSessionTranscriptPath, updateSessionTokens } from "@/lib/queries";
import { parseTranscriptUsage } from "@/lib/transcript-parser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // FK 제약: 세션이 먼저 존재해야 이벤트 삽입 가능
    // SessionStart는 새 세션 생성, 그 외는 기존 세션 없으면 자동 생성
    if (event.hook_event_name === "SessionStart") {
      await upsertSession({
        session_id: event.session_id,
        user_id: userId,
        project_path: event.cwd,
        model: "model" in event && typeof event.model === "string" ? event.model : null,
        permission_mode: event.permission_mode ?? null,
        started_at: stored.timestamp,
        status: "active",
      });
    } else {
      // 다른 이벤트: 세션이 없으면 생성 (최소 정보로)
      await upsertSession({
        session_id: event.session_id,
        user_id: userId,
        project_path: event.cwd,
        started_at: stored.timestamp,
        status: "active",
      });
    }

    await insertEvent(stored);

    // PostToolUse: Pre→Post duration 계산
    if (event.hook_event_name === "PostToolUse" && stored.tool_use_id) {
      await calcToolDuration(stored.tool_use_id, stored.timestamp);
    }

    if (event.hook_event_name === "Stop") {
      const transcriptPath = "transcript_path" in event && typeof event.transcript_path === "string"
        ? event.transcript_path
        : null;
      if (transcriptPath) {
        await upsertSession({
          session_id: event.session_id,
          transcript_path: transcriptPath,
        });
        parseTranscriptUsage(transcriptPath).then(async (usage) => {
          if (usage) {
            await updateSessionTokens(event.session_id, {
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
      await upsertSession({
        session_id: event.session_id,
        ended_at: stored.timestamp,
        status: "ended",
      });
      const tp = await getSessionTranscriptPath(event.session_id);
      if (tp) {
        parseTranscriptUsage(tp).then(async (usage) => {
          if (usage) {
            await updateSessionTokens(event.session_id, {
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
