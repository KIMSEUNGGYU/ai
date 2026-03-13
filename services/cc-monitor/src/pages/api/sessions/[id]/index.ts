// ── PATCH /api/sessions/[id] — task_name 업데이트 ──
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, isDemoMode } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (isDemoMode()) {
    return res.status(200).json({ ok: true, demo: true });
  }

  const sessionId = req.query.id as string;
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID required" });
  }

  const { task_name } = req.body as { task_name?: string | null };

  await prisma!.session.update({
    where: { session_id: sessionId },
    data: { task_name: task_name ?? null },
  });

  return res.status(200).json({ ok: true, session_id: sessionId, task_name });
}
