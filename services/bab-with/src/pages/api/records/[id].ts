import type { NextApiRequest, NextApiResponse } from "next";
import { updateRecord, deleteRecord } from "@/lib/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;

  if (req.method === "PUT") {
    const { date, mealType, companionIds } = req.body;

    if (!date || !mealType || !companionIds?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const record = await updateRecord({ id, date, mealType, companionIds });
      return res.status(200).json(record);
    } catch (err) {
      console.error("[/api/records PUT] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await deleteRecord(id);
      return res.status(204).end();
    } catch (err) {
      console.error("[/api/records DELETE] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
