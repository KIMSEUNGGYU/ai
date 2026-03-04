// ── GET /api/sessions — .ai/specs/cc-monitor/api.md ──
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessions } from "@/lib/queries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const status = (req.query.status as "active" | "ended" | "all") ?? "active";
  const userId = req.query.userId as string | undefined;
  const toolName = req.query.toolName as string | undefined;
  const sessions = await getSessions(status, { userId, toolName });

  return res.status(200).json({ sessions });
}
