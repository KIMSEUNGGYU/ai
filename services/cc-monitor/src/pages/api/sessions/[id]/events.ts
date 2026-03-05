// ── GET /api/sessions/[id]/events ──
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionEvents } from "@/lib/queries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = req.query.id as string;
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID required" });
  }

  const events = await getSessionEvents(sessionId);
  return res.status(200).json({ events });
}
