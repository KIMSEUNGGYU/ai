import type { NextApiRequest, NextApiResponse } from "next";
import { getRecords, createRecord } from "@/lib/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const userId = req.query.userId as string;
    const month = req.query.month as string;

    if (!userId || !month) {
      return res.status(400).json({ error: "userId and month are required" });
    }

    try {
      const records = await getRecords({ userId, month });
      return res.status(200).json(records);
    } catch (err) {
      console.error("[/api/records GET] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    const { userId, date, mealType, companionIds, extraCompanions } = req.body;

    if (!userId || !date || !mealType || !companionIds?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const record = await createRecord({ userId, date, mealType, companionIds, extraCompanions: extraCompanions ?? "" });
      return res.status(201).json(record);
    } catch (err) {
      console.error("[/api/records POST] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
