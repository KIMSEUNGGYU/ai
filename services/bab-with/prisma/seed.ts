import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("TURSO_DATABASE_URL is required");

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

const users = [
  { name: "김수민", team: "product" },
  { name: "김승규", team: "product" },
  { name: "박지윤", team: "product" },
  { name: "손혜정", team: "product" },
  { name: "신상호", team: "product" },
  { name: "신지선", team: "product" },
  { name: "우지원", team: "product" },
  { name: "유명선", team: "product" },
  { name: "이영현", team: "product" },
  { name: "이태림", team: "product" },
  { name: "김수정", team: "data" },
  { name: "정민주", team: "data" },
  { name: "조범규", team: "data" },
  { name: "최기호", team: "data" },
  { name: "테스트", team: "admin" },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { name: user.name },
      update: { team: user.team },
      create: user,
    });
  }
  console.log(`Seeded ${users.length} users`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
