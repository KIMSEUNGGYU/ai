// ── GET /api/analytics — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getToolUsageStats,
  getHourlyActivity,
  getUserSummaries,
} from "@/lib/queries";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const hours = Number(req.query.hours) || 24;

  const tools = getToolUsageStats(hours);
  const hourly = getHourlyActivity(hours);
  const users = getUserSummaries();

  return res.status(200).json({ tools, hourly, users });
}
