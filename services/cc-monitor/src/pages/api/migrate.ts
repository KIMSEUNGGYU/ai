// ── POST /api/migrate — 수동 스키마 마이그레이션 (Turso) ──
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

const MIGRATIONS = [
  {
    name: "add_task_name",
    sql: "ALTER TABLE sessions ADD COLUMN task_name TEXT",
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const results: Array<{ name: string; status: string }> = [];

  for (const m of MIGRATIONS) {
    try {
      await prisma.$executeRawUnsafe(m.sql);
      results.push({ name: m.name, status: "applied" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        results.push({ name: m.name, status: "already_exists" });
      } else {
        results.push({ name: m.name, status: `error: ${msg}` });
      }
    }
  }

  return res.status(200).json({ ok: true, results });
}
