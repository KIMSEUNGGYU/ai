// ── GET /api/feed — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import { getRecentEvents, getEventsSince } from "@/lib/queries";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const limit = Number(req.query.limit) || 50;
  const since = req.query.since as string | undefined;

  const events = since ? getEventsSince(since, limit) : getRecentEvents(limit);

  return res.status(200).json({ events });
}
