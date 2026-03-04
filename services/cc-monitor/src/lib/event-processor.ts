import type { HookEvent, StoredEvent } from "./types";

export function processEvent(event: HookEvent, userId: string): Omit<StoredEvent, "id"> {
  const base: Omit<StoredEvent, "id"> = {
    session_id: event.session_id,
    event_type: event.hook_event_name,
    user_id: userId,
    project_path: event.cwd,
    tool_name: null,
    tool_input_summary: null,
    model: null,
    prompt_text: null,
    permission_mode: event.permission_mode ?? null,
    tool_use_id: null,
    tool_duration_ms: null,
    timestamp: new Date().toISOString(),
    raw_data: null,
  };

  if (event.hook_event_name === "SessionStart") {
    base.model = "model" in event && typeof event.model === "string" ? event.model : null;
  } else if (
    event.hook_event_name === "PreToolUse" ||
    event.hook_event_name === "PostToolUse"
  ) {
    const toolEvent = event as {
      tool_name: string;
      tool_input: Record<string, unknown>;
      tool_use_id?: string;
    };
    base.tool_name = toolEvent.tool_name;
    base.tool_input_summary = summarizeToolInput(toolEvent.tool_name, toolEvent.tool_input);
    base.tool_use_id = toolEvent.tool_use_id ?? null;
  } else if (event.hook_event_name === "UserPromptSubmit") {
    const promptEvent = event as { prompt?: string };
    base.prompt_text = promptEvent.prompt?.substring(0, 500) ?? null;
  }

  return base;
}

function summarizeToolInput(
  toolName: string,
  input: Record<string, unknown>
): string {
  switch (toolName) {
    case "Bash":
      return truncate(String(input.command ?? ""), 150);
    case "Read":
      return String(input.file_path ?? "");
    case "Write":
      return String(input.file_path ?? "");
    case "Edit":
      return String(input.file_path ?? "");
    case "Grep":
      return `pattern: ${input.pattern ?? ""}`;
    case "Glob":
      return String(input.pattern ?? "");
    case "WebFetch":
      return String(input.url ?? "");
    case "WebSearch":
      return String(input.query ?? "");
    case "Skill":
      return `skill: ${input.skill ?? "unknown"}`;
    case "Task":
    case "Agent":
      return `[${input.subagent_type ?? "agent"}] ${truncate(String(input.description ?? ""), 100)}`;
    default:
      if (toolName.startsWith("mcp__")) {
        return `MCP: ${toolName.split("__").slice(1).join("/")}`;
      }
      return toolName;
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}
