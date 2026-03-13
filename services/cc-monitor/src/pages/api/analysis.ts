import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, isDemoMode } from "@/lib/db";

interface ToolBreakdown {
  name: string;
  count: number;
}

interface AnalysisData {
  skills: ToolBreakdown[];
  agents: ToolBreakdown[];
  mcpServers: ToolBreakdown[];
  hooks: ToolBreakdown[];
  commands: ToolBreakdown[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (isDemoMode()) {
    return res.json({
      skills: [{ name: "fe:fe-principles", count: 10 }],
      agents: [{ name: "Explore", count: 5 }],
      mcpServers: [{ name: "serena", count: 20 }],
      hooks: [{ name: "fe-workflow:fe-convention-prompt", count: 8 }],
      commands: [{ name: "Bash", count: 100 }],
    });
  }

  const db = prisma!;

  // Skill 호출: tool_name = 'Skill', tool_input_summary에서 스킬명 추출
  const skillRows = await db.$queryRawUnsafe<Array<{ summary: string | null; cnt: bigint }>>(
    `SELECT tool_input_summary as summary, COUNT(*) as cnt
     FROM events
     WHERE tool_name = 'Skill' AND event_type = 'PostToolUse' AND tool_input_summary IS NOT NULL
     GROUP BY tool_input_summary
     ORDER BY cnt DESC`
  );
  const skills: ToolBreakdown[] = skillRows.map((r) => ({
    name: (r.summary ?? "").replace(/^skill:\s*/, ""),
    count: Number(r.cnt),
  }));

  // Agent 호출: tool_name = 'Agent', summary에서 타입 추출
  const agentRows = await db.$queryRawUnsafe<Array<{ agent_type: string; cnt: bigint }>>(
    `SELECT
       CASE
         WHEN tool_input_summary LIKE '[Explore]%' THEN 'Explore'
         WHEN tool_input_summary LIKE '[Code]%' THEN 'Code'
         WHEN tool_input_summary LIKE '[Research]%' THEN 'Research'
         ELSE COALESCE(tool_input_summary, 'Unknown')
       END as agent_type,
       COUNT(*) as cnt
     FROM events
     WHERE tool_name = 'Agent' AND event_type = 'PostToolUse'
     GROUP BY agent_type
     ORDER BY cnt DESC`
  );
  const agents: ToolBreakdown[] = agentRows.map((r) => ({
    name: r.agent_type,
    count: Number(r.cnt),
  }));

  // MCP 서버: mcp__ prefix에서 서버명 추출
  const mcpRows = await db.$queryRawUnsafe<Array<{ server: string; cnt: bigint }>>(
    `SELECT
       SUBSTR(tool_name, 6, INSTR(SUBSTR(tool_name, 6), '__') - 1) as server,
       COUNT(*) as cnt
     FROM events
     WHERE tool_name LIKE 'mcp__%' AND event_type = 'PostToolUse'
     GROUP BY server
     ORDER BY cnt DESC`
  );
  const mcpServers: ToolBreakdown[] = mcpRows.map((r) => ({
    name: r.server,
    count: Number(r.cnt),
  }));

  // Plugin Hooks: tool_name에 ':' 포함 (fe-workflow:hook-name 형태)
  const hookRows = await db.$queryRawUnsafe<Array<{ tool_name: string; cnt: bigint }>>(
    `SELECT tool_name, COUNT(*) as cnt
     FROM events
     WHERE tool_name LIKE '%:%' AND tool_name NOT LIKE 'mcp__%' AND event_type = 'PostToolUse'
     GROUP BY tool_name
     ORDER BY cnt DESC`
  );
  const hooks: ToolBreakdown[] = hookRows.map((r) => ({
    name: r.tool_name,
    count: Number(r.cnt),
  }));

  // 기본 도구 (Bash, Read, Edit 등)
  const cmdRows = await db.$queryRawUnsafe<Array<{ tool_name: string; cnt: bigint }>>(
    `SELECT tool_name, COUNT(*) as cnt
     FROM events
     WHERE tool_name IS NOT NULL
       AND tool_name NOT IN ('Skill', 'Agent')
       AND tool_name NOT LIKE 'mcp__%'
       AND tool_name NOT LIKE '%:%'
       AND event_type = 'PostToolUse'
     GROUP BY tool_name
     ORDER BY cnt DESC
     LIMIT 20`
  );
  const commands: ToolBreakdown[] = cmdRows.map((r) => ({
    name: r.tool_name,
    count: Number(r.cnt),
  }));

  const data: AnalysisData = { skills, agents, mcpServers, hooks, commands };
  return res.json(data);
}
