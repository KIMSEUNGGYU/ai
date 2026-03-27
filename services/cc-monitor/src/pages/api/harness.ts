// ── GET /api/harness — 하네스 품질 메트릭 API ──
import type { NextApiRequest, NextApiResponse } from "next";
import { getHarnessData } from "@/lib/harness-queries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const days = req.query.days ? Number(req.query.days) : 30;

  try {
    const data = await getHarnessData(days);
    return res.status(200).json(data);
  } catch (err) {
    console.error("[/api/harness] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
