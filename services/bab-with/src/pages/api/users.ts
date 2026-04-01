import type { NextApiRequest, NextApiResponse } from "next";
import { getUsers } from "@/lib/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const users = await getUsers();
    return res.status(200).json(users);
  } catch (err) {
    console.error("[/api/users] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
