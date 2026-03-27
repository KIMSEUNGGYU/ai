// ── /api/adoption — Adoption 스냅샷 생성/조회 API ──
import type { NextApiRequest, NextApiResponse } from "next";
import { generateAdoptionSnapshot, getAdoptionTimeline } from "@/lib/harness-queries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "POST") {
      const period = (req.body?.period === "week" ? "week" : "day") as "day" | "week";
      const snapshot = await generateAdoptionSnapshot(period);
      return res.status(200).json(snapshot);
    }

    if (req.method === "GET") {
      const period = (req.query.period === "week" ? "week" : "day") as "day" | "week";
      const days = req.query.days ? Number(req.query.days) : 30;
      const timeline = await getAdoptionTimeline(period, days);
      return res.status(200).json({ timeline });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[/api/adoption] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
