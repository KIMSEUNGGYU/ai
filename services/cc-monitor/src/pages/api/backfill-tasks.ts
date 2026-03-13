// ── POST /api/backfill-tasks — active 파일 기반 task_name 백필 ──
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, isDemoMode } from "@/lib/db";

interface TaskMapping {
  task_name: string;
  session_ids: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (isDemoMode()) {
    return res.status(200).json({ ok: true, demo: true });
  }

  const { mappings } = req.body as { mappings: TaskMapping[] };
  if (!Array.isArray(mappings)) {
    return res.status(400).json({ error: "mappings array required" });
  }

  const db = prisma!;
  let updated = 0;

  for (const m of mappings) {
    for (const sid of m.session_ids) {
      try {
        await db.$executeRawUnsafe(
          "UPDATE sessions SET task_name = ? WHERE session_id = ?",
          m.task_name,
          sid
        );
        updated++;
      } catch {
        // skip non-existent sessions
      }
    }
  }

  return res.status(200).json({ ok: true, updated });
}
