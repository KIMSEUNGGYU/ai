// ── POST /api/events — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import type { HookEvent } from "@/lib/types";
import { processEvent } from "@/lib/event-processor";
import { insertEvent, upsertSession, calcToolDuration, updateSessionTokens } from "@/lib/queries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body as HookEvent;

    if (!event.session_id || !event.hook_event_name) {
      return res.status(400).json({ error: "session_id and hook_event_name required" });
    }

    // ClaudeProbe (health check) 세션 서버 측 필터링
    if (event.cwd && typeof event.cwd === "string" && event.cwd.includes("ClaudeProbe")) {
      return res.status(200).json({ ok: true, filtered: "ClaudeProbe" });
    }

    const userId =
      (req.headers["x-cc-user"] as string) ??
      extractUserFromCwd(event.cwd) ??
      "unknown";

    const stored = processEvent(event, userId);

    // FK 제약: 세션이 먼저 존재해야 이벤트 삽입 가능
    // SessionStart는 새 세션 생성, 그 외는 기존 세션 없으면 자동 생성
    if (event.hook_event_name === "SessionStart") {
      const config = "config_snapshot" in event ? event.config_snapshot as Record<string, unknown> | null : null;
      const activeTask = config?.active_task as string | null | undefined;
      await upsertSession({
        session_id: event.session_id,
        user_id: userId,
        project_path: event.cwd,
        model: "model" in event && typeof event.model === "string" ? event.model : null,
        permission_mode: event.permission_mode ?? null,
        started_at: stored.timestamp,
        status: "active",
        ...(activeTask ? { task_name: activeTask } : {}),
        ...(config ? {
          config_claude_md_count: config.claude_md_count as number,
          config_rules_count: config.rules_count as number,
          config_mcp_count: config.mcp_count as number,
          config_hooks_count: config.hooks_count as number,
          config_mcp_names: JSON.stringify(config.mcp_names),
          config_rules_names: JSON.stringify(config.rules_names),
          config_claude_md_paths: JSON.stringify(config.claude_md_paths),
          config_hooks_events: JSON.stringify(config.hooks_events),
        } : {}),
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

    if (event.hook_event_name === "Stop" || event.hook_event_name === "SessionEnd") {
      const transcriptPath = "transcript_path" in event && typeof event.transcript_path === "string"
        ? event.transcript_path
        : null;
      const toolSummary = "tool_summary" in event ? event.tool_summary : null;
      const usage = "transcript_usage" in event && event.transcript_usage
        ? event.transcript_usage as { input_tokens: number; output_tokens: number; cache_create_tokens: number; cache_read_tokens: number; num_turns: number }
        : null;

      const sessionUpdate: Record<string, unknown> = {
        session_id: event.session_id,
      };
      if (event.hook_event_name === "SessionEnd") {
        sessionUpdate.ended_at = stored.timestamp;
        sessionUpdate.status = "ended";
      }
      if (transcriptPath) sessionUpdate.transcript_path = transcriptPath;
      if (toolSummary) sessionUpdate.tool_summary = JSON.stringify(toolSummary);

      await upsertSession(sessionUpdate as Parameters<typeof upsertSession>[0]);

      if (usage) {
        try {
          await updateSessionTokens(event.session_id, {
            total_input_tokens: usage.input_tokens,
            total_output_tokens: usage.output_tokens,
            total_cache_create_tokens: usage.cache_create_tokens,
            total_cache_read_tokens: usage.cache_read_tokens,
            num_turns: usage.num_turns,
          });
          console.log(`[cc-monitor] Token update OK: session=${event.session_id}, input=${usage.input_tokens}, output=${usage.output_tokens}`);
        } catch (tokenError) {
          console.error(`[cc-monitor] Token update FAILED: session=${event.session_id}`, tokenError);
        }
      } else {
        console.warn(`[cc-monitor] No transcript_usage in ${event.hook_event_name}: session=${event.session_id}`);
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
