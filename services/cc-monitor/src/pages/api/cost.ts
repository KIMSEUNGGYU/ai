// ── GET /api/cost — 비용 추적 API ──
import type { NextApiRequest, NextApiResponse } from "next";
import { getCostResponse } from "@/lib/cost-queries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = req.query.userId as string | undefined;
  const days = req.query.days ? Number(req.query.days) : undefined;
  const filters = userId ? { userId } : undefined;

  try {
    const data = await getCostResponse(filters, days);
    return res.status(200).json(data);
  } catch (err) {
    console.error("[/api/cost] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
