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
  Skill: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Agent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Bash: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  File: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Search: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  MCP: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  Prompt: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  Session: "bg-red-500/20 text-red-300 border-red-500/30",
  Question: "bg-pink-500/20 text-pink-300 border-pink-500/30",
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
