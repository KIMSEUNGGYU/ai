// ── Hook 이벤트 타입 (Claude Code stdin JSON) ──

export type HookEventName =
  | "SessionStart"
  | "SessionEnd"
  | "PreToolUse"
  | "PostToolUse"
  | "UserPromptSubmit"
  | "Stop"
  | "Notification"
  | "SubagentStart"
  | "SubagentStop"
  | "PreCompact";

export interface HookEventBase {
  session_id: string;
  transcript_path?: string;
  cwd: string;
  permission_mode?: string;
  hook_event_name: HookEventName;
}

export interface SessionStartEvent extends HookEventBase {
  hook_event_name: "SessionStart";
  source?: "startup" | "resume" | "clear" | "compact";
  model?: string;
}

export interface SessionEndEvent extends HookEventBase {
  hook_event_name: "SessionEnd";
  reason?: string;
}

export interface ToolUseEvent extends HookEventBase {
  hook_event_name: "PreToolUse" | "PostToolUse";
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_use_id?: string;
}

export interface UserPromptSubmitEvent extends HookEventBase {
  hook_event_name: "UserPromptSubmit";
  prompt?: string;
}

export interface StopEvent extends HookEventBase {
  hook_event_name: "Stop";
  stop_hook_active?: boolean;
  last_assistant_message?: string;
}

export type HookEvent =
  | SessionStartEvent
  | SessionEndEvent
  | ToolUseEvent
  | UserPromptSubmitEvent
  | StopEvent
  | (HookEventBase & Record<string, unknown>);

// ── 저장용 타입 ──

export interface StoredEvent {
  id?: number;
  session_id: string;
  event_type: HookEventName;
  user_id: string;
  project_path: string;
  tool_name: string | null;
  tool_input_summary: string | null;
  model: string | null;
  prompt_text: string | null;
  timestamp: string;
  raw_data: string | null;
}

export interface Session {
  session_id: string;
  user_id: string;
  project_path: string;
  model: string | null;
  started_at: string;
  ended_at: string | null;
  event_count: number;
  tool_count: number;
  status: "active" | "ended";
}

// ── 분석 타입 ──

export interface ToolUsageStat {
  tool_name: string;
  count: number;
  percentage: number;
}

export interface HourlyActivity {
  hour: number;
  count: number;
}

export interface UserSummary {
  user_id: string;
  active_sessions: number;
  total_events: number;
  last_activity: string;
}
