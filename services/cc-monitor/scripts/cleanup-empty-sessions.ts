#!/usr/bin/env npx tsx
/**
 * Turso DB에서 프롬프트가 없는 세션 정리 스크립트.
 * 기준: UserPromptSubmit 이벤트가 하나도 없는 세션
 *
 * 사용법:
 *   npx tsx scripts/cleanup-empty-sessions.ts          # dry-run (확인만)
 *   npx tsx scripts/cleanup-empty-sessions.ts --run     # 실제 삭제
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL 환경변수가 필요합니다.");
  process.exit(1);
}

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

const isDryRun = !process.argv.includes("--run");

async function main() {
  const emptySessions = await prisma.$queryRawUnsafe<
    Array<{ session_id: string; started_at: string; project_path: string | null; num_turns: number | null }>
  >(`
    SELECT s.session_id, s.started_at, s.project_path, s.num_turns
    FROM sessions s
    WHERE NOT EXISTS (
      SELECT 1 FROM events e
      WHERE e.session_id = s.session_id AND e.event_type = 'UserPromptSubmit'
    )
    ORDER BY s.started_at DESC
  `);

  console.log(`프롬프트 없는 세션 수: ${emptySessions.length}`);

  if (emptySessions.length === 0) {
    console.log("정리할 세션이 없습니다.");
    return;
  }

  for (const s of emptySessions) {
    console.log(`  - ${s.session_id} | turns: ${s.num_turns ?? "null"} | ${s.started_at} | ${s.project_path ?? "(없음)"}`);
  }

  if (isDryRun) {
    console.log("\n[dry-run] --run 플래그를 추가하면 실제 삭제됩니다.");
    return;
  }

  const sessionIds = emptySessions.map((s) => s.session_id);

  const deletedPromptLogs = await prisma.promptLog.deleteMany({
    where: { session_id: { in: sessionIds } },
  });
  const deletedEvents = await prisma.event.deleteMany({
    where: { session_id: { in: sessionIds } },
  });
  const deletedSessions = await prisma.session.deleteMany({
    where: { session_id: { in: sessionIds } },
  });

  console.log(`\n삭제 완료:`);
  console.log(`  prompt_logs: ${deletedPromptLogs.count}`);
  console.log(`  events: ${deletedEvents.count}`);
  console.log(`  sessions: ${deletedSessions.count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
