interface User {
  id: string;
  name: string;
  team: string;
}

interface RecordCompanion {
  id: string;
  userId: string;
  user: User;
}

interface MealRecord {
  id: string;
  userId: string;
  date: string;
  mealType: string;
  companions: RecordCompanion[];
  createdAt: string;
  updatedAt: string;
}

export type { User, MealRecord, RecordCompanion };

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchRecords(
  userId: string,
  month: string
): Promise<MealRecord[]> {
  const res = await fetch(
    `/api/records?userId=${userId}&month=${month}`
  );
  if (!res.ok) throw new Error("Failed to fetch records");
  return res.json();
}

interface CreateRecordBody {
  userId: string;
  date: string;
  mealType: string;
  companionIds: string[];
}

export async function createRecord(body: CreateRecordBody): Promise<MealRecord> {
  const res = await fetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create record");
  return res.json();
}

export async function updateRecord(
  id: string,
  body: Omit<CreateRecordBody, "userId">
): Promise<MealRecord> {
  const res = await fetch(`/api/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update record");
  return res.json();
}

export async function deleteRecord(id: string): Promise<void> {
  const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete record");
}
