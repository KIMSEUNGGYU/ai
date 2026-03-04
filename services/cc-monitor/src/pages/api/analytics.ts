// ── GET /api/analytics — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getToolUsageStats,
  getToolDurationStats,
  getHourlyActivity,
  getUserSummaries,
  getTokenUsageSummary,
} from "@/lib/queries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const hours = Number(req.query.hours) || 24;
  const userId = req.query.userId as string | undefined;
  const toolName = req.query.toolName as string | undefined;
  const filters = { userId, toolName };

  const [tools, toolDurations, hourly, users, tokenUsage] = await Promise.all([
    getToolUsageStats(hours, filters),
    getToolDurationStats(hours, filters),
    getHourlyActivity(hours, filters),
    getUserSummaries(filters),
    getTokenUsageSummary(filters),
  ]);

  return res.status(200).json({ tools, toolDurations, hourly, users, tokenUsage });
}
