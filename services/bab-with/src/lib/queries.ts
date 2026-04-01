import { prisma } from "./db";

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: [{ team: "asc" }, { name: "asc" }],
  });
}

interface CreateRecordInput {
  userId: string;
  date: string;
  mealType: string;
  companionIds: string[];
  extraCompanions: string;
}

export async function createRecord(input: CreateRecordInput) {
  return prisma.record.create({
    data: {
      userId: input.userId,
      date: input.date,
      mealType: input.mealType,
      extraCompanions: input.extraCompanions,
      companions: {
        create: input.companionIds.map((userId) => ({ userId })),
      },
    },
    include: {
      companions: { include: { user: true } },
    },
  });
}

interface GetRecordsInput {
  userId: string;
  month: string;
}

export async function getRecords(input: GetRecordsInput) {
  return prisma.record.findMany({
    where: {
      userId: input.userId,
      date: { startsWith: input.month },
    },
    include: {
      companions: { include: { user: true } },
    },
    orderBy: { date: "desc" },
  });
}

interface UpdateRecordInput {
  id: string;
  date: string;
  mealType: string;
  companionIds: string[];
  extraCompanions: string;
}

export async function updateRecord(input: UpdateRecordInput) {
  await prisma.recordCompanion.deleteMany({
    where: { recordId: input.id },
  });

  return prisma.record.update({
    where: { id: input.id },
    data: {
      date: input.date,
      mealType: input.mealType,
      extraCompanions: input.extraCompanions,
      companions: {
        create: input.companionIds.map((userId) => ({ userId })),
      },
    },
    include: {
      companions: { include: { user: true } },
    },
  });
}

export async function deleteRecord(id: string) {
  return prisma.record.delete({ where: { id } });
}
