// ── GET /api/feed — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import { getRecentEvents, getEventsSince } from "@/lib/queries";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const limit = Number(req.query.limit) || 50;
  const since = req.query.since as string | undefined;
  const userId = req.query.userId as string | undefined;
  const toolName = req.query.toolName as string | undefined;
  const filters = { userId, toolName };

  const events = since ? getEventsSince(since, limit, filters) : getRecentEvents(limit, filters);

  return res.status(200).json({ events });
}
