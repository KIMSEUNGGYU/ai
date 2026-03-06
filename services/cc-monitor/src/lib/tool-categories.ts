export type ToolCategory =
  | "Skill"
  | "Agent"
  | "Bash"
  | "File"
  | "Search"
  | "MCP"
  | "Prompt"
  | "Session"
  | "Question";

const TOOL_NAME_MAP: Record<string, ToolCategory> = {
  Skill: "Skill",
  Agent: "Agent",
  Bash: "Bash",
  Read: "File",
  Edit: "File",
  Write: "File",
  NotebookEdit: "File",
  Grep: "Search",
  Glob: "Search",
  ToolSearch: "Search",
  AskUserQuestion: "Question",
};

const EVENT_TYPE_MAP: Record<string, ToolCategory> = {
  SubagentStart: "Agent",
  SubagentStop: "Agent",
  UserPromptSubmit: "Prompt",
  SessionStart: "Session",
  SessionEnd: "Session",
  Stop: "Session",
  PreCompact: "Session",
};

export function getToolCategory(
  toolName: string | null,
  eventType: string,
): ToolCategory {
  // eventType 기반 매핑 (toolName 없거나 Session/Prompt 계열)
  const eventCategory = EVENT_TYPE_MAP[eventType];
  if (!toolName || eventCategory) {
    return eventCategory ?? "Bash";
  }

  // MCP prefix
  if (toolName.startsWith("mcp__")) {
    return "MCP";
  }

  // 정적 매핑
  return TOOL_NAME_MAP[toolName] ?? "Bash";
}

export const CATEGORY_COLORS: Record<ToolCategory, string> = {
  Skill: "bg-violet-100 text-violet-800 border-violet-200",
  Agent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Bash: "bg-orange-100 text-orange-800 border-orange-200",
  File: "bg-blue-100 text-blue-800 border-blue-200",
  Search: "bg-yellow-100 text-yellow-800 border-yellow-200",
  MCP: "bg-teal-100 text-teal-800 border-teal-200",
  Prompt: "bg-slate-100 text-slate-800 border-slate-200",
  Session: "bg-red-100 text-red-800 border-red-200",
  Question: "bg-pink-100 text-pink-800 border-pink-200",
};

export const ALL_CATEGORIES: ToolCategory[] = [
  "Skill",
  "Agent",
  "Bash",
  "File",
  "Search",
  "MCP",
  "Prompt",
  "Session",
  "Question",
];
