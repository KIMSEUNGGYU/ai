// ── GET /api/analytics — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getToolUsageStats,
  getToolDurationStats,
  getHourlyActivity,
  getUserSummaries,
  getTokenUsageSummary,
} from "@/lib/queries";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const hours = Number(req.query.hours) || 24;
  const userId = req.query.userId as string | undefined;
  const toolName = req.query.toolName as string | undefined;
  const filters = { userId, toolName };

  const tools = getToolUsageStats(hours, filters);
  const toolDurations = getToolDurationStats(hours, filters);
  const hourly = getHourlyActivity(hours, filters);
  const users = getUserSummaries(filters);
  const tokenUsage = getTokenUsageSummary(filters);

  return res.status(200).json({ tools, toolDurations, hourly, users, tokenUsage });
}
