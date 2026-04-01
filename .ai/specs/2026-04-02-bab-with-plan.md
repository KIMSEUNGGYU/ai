# bab-with Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** bizfest 법인카드 식사 동행 기록 모바일 웹앱

**Architecture:** Next.js 15 Pages Router + Prisma + Turso(LibSQL) + Tailwind CSS. cc-monitor 패턴 기반. localStorage로 사용자 식별, 하단 3탭(등록/히스토리/설정) 구조.

**Tech Stack:** Next.js 15, React 19, Prisma 7, Turso(LibSQL), Tailwind CSS, TanStack Query, Vercel

---

## File Structure

```
services/bab-with/
├── prisma/
│   ├── schema.prisma          # User, Record, RecordCompanion 모델
│   └── seed.ts                # 14명 시드 데이터
├── src/
│   ├── pages/
│   │   ├── _app.tsx           # QueryClient + globals.css
│   │   ├── _document.tsx      # viewport meta (모바일)
│   │   └── api/
│   │       ├── users.ts       # GET 팀원 목록
│   │       ├── records.ts     # GET(월별 조회), POST(생성)
│   │       └── records/
│   │           └── [id].ts    # PUT(수정), DELETE(삭제)
│   ├── components/
│   │   ├── Layout.tsx         # 하단 탭바 + 페이지 래퍼
│   │   ├── Onboarding.tsx     # 최초 이름 선택
│   │   ├── RegisterTab.tsx    # 등록 탭
│   │   ├── HistoryTab.tsx     # 히스토리 탭
│   │   ├── SettingsTab.tsx    # 설정 탭
│   │   ├── MealTypeSelector.tsx  # 점심/석식/기타 선택
│   │   ├── CompanionSelector.tsx # 팀별 배지 동행자 선택
│   │   └── RecordCard.tsx     # 히스토리 카드 아이템
│   ├── lib/
│   │   ├── db.ts              # Prisma + Turso 싱글톤
│   │   ├── queries.ts         # DB 쿼리 함수
│   │   └── api-client.ts      # fetch 래퍼
│   └── styles/
│       └── globals.css        # Tailwind directives
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── .env.local                 # TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
```

---

### Task 1: 프로젝트 초기화

**Files:**
- Create: `services/bab-with/package.json`
- Create: `services/bab-with/tsconfig.json`
- Create: `services/bab-with/next.config.ts`
- Create: `services/bab-with/tailwind.config.ts`
- Create: `services/bab-with/postcss.config.mjs`
- Create: `services/bab-with/src/styles/globals.css`
- Create: `services/bab-with/src/pages/_app.tsx`
- Create: `services/bab-with/src/pages/_document.tsx`

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "bab-with",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "prisma generate && next dev -p 4001",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@libsql/client": "^0.17.0",
    "@prisma/adapter-libsql": "^7.4.2",
    "@prisma/client": "^7.4.2",
    "@tanstack/react-query": "^5.90.21",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.0",
    "prisma": "^7.4.2",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: next.config.ts 생성**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: tailwind.config.ts 생성**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: postcss.config.mjs 생성**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: globals.css 생성**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: _document.tsx 생성 (모바일 viewport)**

```tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

- [ ] **Step 8: _app.tsx 생성**

```tsx
import { useState } from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 9: pnpm install 및 dev 서버 확인**

Run: `cd services/bab-with && pnpm install`
Run: `pnpm dev`
Expected: Next.js dev 서버가 http://localhost:4001에서 실행 (404 페이지 — 아직 index 없음)

- [ ] **Step 10: Commit**

```bash
git add services/bab-with/
git commit -m "feat: bab-with 프로젝트 초기화 (Next.js + Tailwind + React Query)"
```

---

### Task 2: Prisma + Turso 설정 및 시드

**Files:**
- Create: `services/bab-with/prisma/schema.prisma`
- Create: `services/bab-with/prisma/seed.ts`
- Create: `services/bab-with/src/lib/db.ts`
- Create: `services/bab-with/.env.local`

- [ ] **Step 1: .env.local 생성**

```
TURSO_DATABASE_URL=libsql://[DB이름]-[계정].turso.io
TURSO_AUTH_TOKEN=[토큰]
```

Turso 대시보드에서 새 DB 생성 후 URL과 토큰 입력.

- [ ] **Step 2: schema.prisma 생성**

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id         String            @id @default(cuid())
  name       String            @unique
  team       String
  records    Record[]
  companions RecordCompanion[] @relation("companions")
}

model Record {
  id         String            @id @default(cuid())
  userId     String
  user       User              @relation(fields: [userId], references: [id])
  date       String
  mealType   String
  companions RecordCompanion[]
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt

  @@index([userId])
  @@index([date])
}

model RecordCompanion {
  id       String @id @default(cuid())
  recordId String
  record   Record @relation(fields: [recordId], references: [id], onDelete: Cascade)
  userId   String
  user     User   @relation("companions", fields: [userId], references: [id])

  @@unique([recordId, userId])
  @@index([recordId])
  @@index([userId])
}
```

- [ ] **Step 3: db.ts 생성 (Prisma + Turso 싱글톤)**

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL is required");
  }

  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 4: seed.ts 생성**

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("TURSO_DATABASE_URL is required");

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

const users = [
  // 제품팀
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
  // 데이터팀
  { name: "김수정", team: "data" },
  { name: "정민주", team: "data" },
  { name: "조범규", team: "data" },
  { name: "최기호", team: "data" },
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
```

- [ ] **Step 5: Prisma generate 및 DB push**

Run: `cd services/bab-with && pnpm prisma generate && pnpm db:push`
Expected: 테이블 3개 생성 (User, Record, RecordCompanion)

- [ ] **Step 6: 시드 실행**

Run: `cd services/bab-with && pnpm db:seed`
Expected: "Seeded 14 users"

- [ ] **Step 7: Commit**

```bash
git add services/bab-with/prisma/ services/bab-with/src/lib/db.ts
git commit -m "feat: Prisma + Turso 설정 및 14명 시드 데이터"
```

---

### Task 3: API Routes

**Files:**
- Create: `services/bab-with/src/lib/queries.ts`
- Create: `services/bab-with/src/pages/api/users.ts`
- Create: `services/bab-with/src/pages/api/records.ts`
- Create: `services/bab-with/src/pages/api/records/[id].ts`

- [ ] **Step 1: queries.ts 생성 (DB 쿼리 함수)**

```typescript
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
}

export async function createRecord(input: CreateRecordInput) {
  return prisma.record.create({
    data: {
      userId: input.userId,
      date: input.date,
      mealType: input.mealType,
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
  month: string; // "2026-04"
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
```

- [ ] **Step 2: api/users.ts 생성**

```typescript
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
```

- [ ] **Step 3: api/records.ts 생성 (GET + POST)**

```typescript
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
    const { userId, date, mealType, companionIds } = req.body;

    if (!userId || !date || !mealType || !companionIds?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const record = await createRecord({ userId, date, mealType, companionIds });
      return res.status(201).json(record);
    } catch (err) {
      console.error("[/api/records POST] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
```

- [ ] **Step 4: api/records/[id].ts 생성 (PUT + DELETE)**

```typescript
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
```

- [ ] **Step 5: dev 서버에서 API 테스트**

Run: `curl http://localhost:4001/api/users`
Expected: 14명 유저 JSON 배열

- [ ] **Step 6: Commit**

```bash
git add services/bab-with/src/lib/queries.ts services/bab-with/src/pages/api/
git commit -m "feat: API Routes (users, records CRUD)"
```

---

### Task 4: API Client + 공통 컴포넌트

**Files:**
- Create: `services/bab-with/src/lib/api-client.ts`
- Create: `services/bab-with/src/components/Layout.tsx`
- Create: `services/bab-with/src/components/MealTypeSelector.tsx`
- Create: `services/bab-with/src/components/CompanionSelector.tsx`

- [ ] **Step 1: api-client.ts 생성**

```typescript
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
```

- [ ] **Step 2: Layout.tsx 생성 (하단 탭바)**

```tsx
import { type ReactNode } from "react";

type Tab = "register" | "history" | "settings";

interface LayoutProps {
  children: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const tabs: Array<{ key: Tab; icon: string; label: string }> = [
    { key: "register", icon: "📝", label: "등록" },
    { key: "history", icon: "📋", label: "히스토리" },
    { key: "settings", icon: "⚙️", label: "설정" },
  ];

  return (
    <div className="flex flex-col h-dvh bg-white max-w-[430px] mx-auto">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav className="flex border-t border-gray-200 pb-5 pt-2 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 text-xs ${
              activeTab === tab.key
                ? "text-blue-600 font-semibold"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 3: MealTypeSelector.tsx 생성**

```tsx
interface MealTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const mealTypes = [
  { key: "lunch", label: "점심" },
  { key: "dinner", label: "석식" },
  { key: "other", label: "기타" },
];

export default function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  return (
    <div className="flex gap-2 justify-center">
      {mealTypes.map((type) => (
        <button
          key={type.key}
          onClick={() => onChange(type.key)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            value === type.key
              ? "bg-blue-600 text-white"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: CompanionSelector.tsx 생성**

```tsx
import type { User } from "@/lib/api-client";

interface CompanionSelectorProps {
  users: User[];
  selected: Set<string>;
  currentUserId: string;
  onToggle: (userId: string) => void;
}

export default function CompanionSelector({
  users,
  selected,
  currentUserId,
  onToggle,
}: CompanionSelectorProps) {
  const productTeam = users.filter(
    (u) => u.team === "product" && u.id !== currentUserId
  );
  const dataTeam = users.filter(
    (u) => u.team === "data" && u.id !== currentUserId
  );

  return (
    <div className="space-y-4">
      <TeamGroup
        label="제품팀"
        users={productTeam}
        selected={selected}
        onToggle={onToggle}
      />
      <TeamGroup
        label="데이터팀"
        users={dataTeam}
        selected={selected}
        onToggle={onToggle}
      />
    </div>
  );
}

interface TeamGroupProps {
  label: string;
  users: User[];
  selected: Set<string>;
  onToggle: (userId: string) => void;
}

function TeamGroup({ label, users, selected, onToggle }: TeamGroupProps) {
  return (
    <div>
      <div className="text-xs text-gray-400 font-semibold tracking-wide mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {users.map((user) => {
          const isSelected = selected.has(user.id);
          return (
            <button
              key={user.id}
              onClick={() => onToggle(user.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
              }`}
            >
              {user.name}
              {isSelected && " ✓"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add services/bab-with/src/lib/api-client.ts services/bab-with/src/components/
git commit -m "feat: Layout, MealTypeSelector, CompanionSelector 컴포넌트"
```

---

### Task 5: 온보딩 + 메인 페이지

**Files:**
- Create: `services/bab-with/src/components/Onboarding.tsx`
- Create: `services/bab-with/src/pages/index.tsx`

- [ ] **Step 1: Onboarding.tsx 생성**

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/lib/api-client";
import type { User } from "@/lib/api-client";

interface OnboardingProps {
  onComplete: (userId: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-white">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-white px-6">
        <p className="text-xl font-bold text-gray-900 mb-2">
          {selectedUser.name}님으로 시작할게요
        </p>
        <p className="text-sm text-gray-400 mb-8">
          설정에서 언제든 변경할 수 있어요
        </p>
        <button
          onClick={() => onComplete(selectedUser.id)}
          className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-semibold"
        >
          확인
        </button>
        <button
          onClick={() => setSelectedUser(null)}
          className="mt-3 text-sm text-gray-400"
        >
          다시 선택
        </button>
      </div>
    );
  }

  const productTeam = users?.filter((u) => u.team === "product") ?? [];
  const dataTeam = users?.filter((u) => u.team === "data") ?? [];

  return (
    <div className="flex flex-col h-dvh bg-white px-6 pt-16">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
        bab-with
      </h1>
      <p className="text-sm text-gray-400 text-center mb-8">
        본인 이름을 선택해주세요
      </p>

      <div className="space-y-5">
        <div>
          <div className="text-xs text-gray-400 font-semibold tracking-wide mb-2">
            제품팀
          </div>
          <div className="flex flex-wrap gap-2">
            {productTeam.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 active:bg-blue-600 active:text-white"
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 font-semibold tracking-wide mb-2">
            데이터팀
          </div>
          <div className="flex flex-wrap gap-2">
            {dataTeam.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 active:bg-blue-600 active:text-white"
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: index.tsx 생성 (메인 페이지 — 탭 전환 + 온보딩)**

```tsx
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Onboarding from "@/components/Onboarding";
import RegisterTab from "@/components/RegisterTab";
import HistoryTab from "@/components/HistoryTab";
import SettingsTab from "@/components/SettingsTab";

type Tab = "register" | "history" | "settings";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("register");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("bab-with-user-id");
    if (stored) setUserId(stored);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null;

  if (!userId) {
    return (
      <Onboarding
        onComplete={(id) => {
          localStorage.setItem("bab-with-user-id", id);
          setUserId(id);
        }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("bab-with-user-id");
    setUserId(null);
    setActiveTab("register");
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "register" && <RegisterTab userId={userId} />}
      {activeTab === "history" && <HistoryTab userId={userId} />}
      {activeTab === "settings" && <SettingsTab onLogout={handleLogout} />}
    </Layout>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add services/bab-with/src/
git commit -m "feat: 온보딩 + 메인 페이지 (탭 전환)"
```

---

### Task 6: 등록 탭

**Files:**
- Create: `services/bab-with/src/components/RegisterTab.tsx`

- [ ] **Step 1: RegisterTab.tsx 생성**

```tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, createRecord } from "@/lib/api-client";
import MealTypeSelector from "./MealTypeSelector";
import CompanionSelector from "./CompanionSelector";

interface RegisterTabProps {
  userId: string;
}

function getDefaultMealType(): string {
  const hour = new Date().getHours();
  return hour < 17 ? "lunch" : "dinner";
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = days[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}

export default function RegisterTab({ userId }: RegisterTabProps) {
  const today = new Date();
  const [mealType, setMealType] = useState(getDefaultMealType);
  const [selectedCompanions, setSelectedCompanions] = useState<Set<string>>(
    new Set()
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const queryClient = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const mutation = useMutation({
    mutationFn: createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      setSelectedCompanions(new Set());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  const handleToggle = (id: string) => {
    setSelectedCompanions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (selectedCompanions.size === 0) return;
    mutation.mutate({
      userId,
      date: formatDate(today),
      mealType,
      companionIds: Array.from(selectedCompanions),
    });
  };

  return (
    <div className="px-5 pt-12 pb-4 flex flex-col h-full">
      <div className="text-center mb-5">
        <h1 className="text-xl font-bold text-gray-900">오늘의 식사</h1>
        <p className="text-sm text-gray-400 mt-1">
          {formatDisplayDate(today)}
        </p>
      </div>

      <div className="mb-6">
        <MealTypeSelector value={mealType} onChange={setMealType} />
      </div>

      <div className="flex-1">
        {users && (
          <CompanionSelector
            users={users}
            selected={selectedCompanions}
            currentUserId={userId}
            onToggle={handleToggle}
          />
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={selectedCompanions.size === 0 || mutation.isPending}
        className={`w-full py-4 rounded-xl text-base font-semibold transition-colors ${
          selectedCompanions.size === 0
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : saveSuccess
              ? "bg-green-500 text-white"
              : "bg-blue-600 text-white active:bg-blue-700"
        }`}
      >
        {mutation.isPending
          ? "저장 중..."
          : saveSuccess
            ? "저장 완료 ✓"
            : "저장"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: dev 서버에서 등록 탭 동작 확인**

Run: `open http://localhost:4001`
Expected: 온보딩 → 이름 선택 → 등록 탭 (날짜, 식사구분, 배지, 저장 버튼)

- [ ] **Step 3: Commit**

```bash
git add services/bab-with/src/components/RegisterTab.tsx
git commit -m "feat: 등록 탭 (식사구분 + 동행자 선택 + 저장)"
```

---

### Task 7: 히스토리 탭

**Files:**
- Create: `services/bab-with/src/components/RecordCard.tsx`
- Create: `services/bab-with/src/components/HistoryTab.tsx`

- [ ] **Step 1: RecordCard.tsx 생성**

```tsx
import type { MealRecord } from "@/lib/api-client";

interface RecordCardProps {
  record: MealRecord;
  onEdit: (record: MealRecord) => void;
}

const mealTypeLabels: Record<string, { label: string; color: string; bg: string }> = {
  lunch: { label: "점심", color: "text-blue-600", bg: "bg-blue-50" },
  dinner: { label: "석식", color: "text-amber-500", bg: "bg-amber-50" },
  other: { label: "기타", color: "text-gray-500", bg: "bg-gray-100" },
};

function formatCardDate(dateStr: string): { date: string; day: string } {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const month = d.getMonth() + 1;
  const date = d.getDate();
  return { date: `${month}/${date}`, day: days[d.getDay()] };
}

export default function RecordCard({ record, onEdit }: RecordCardProps) {
  const { date, day } = formatCardDate(record.date);
  const meal = mealTypeLabels[record.mealType] ?? mealTypeLabels.other;
  const names = record.companions.map((c) => c.user.name).join(", ");

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(names);
  };

  return (
    <div
      onClick={() => onEdit(record)}
      className="bg-gray-50 rounded-xl px-3.5 py-3 border border-gray-100 flex items-center cursor-pointer active:bg-gray-100"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[15px] font-semibold text-gray-900">
            {date} {day}
          </span>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${meal.color} ${meal.bg}`}
          >
            {meal.label}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <button
            onClick={handleCopy}
            className="flex-shrink-0 mr-1.5 text-gray-400 hover:text-gray-600 active:text-blue-600"
            title="이름 복사"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="8" y="8" width="14" height="14" rx="2" />
              <path d="M4 16V4a2 2 0 0 1 2-2h12" />
            </svg>
          </button>
          <span className="truncate">{names}</span>
        </div>
      </div>
      <span className="text-gray-300 text-lg ml-2 flex-shrink-0">›</span>
    </div>
  );
}
```

- [ ] **Step 2: HistoryTab.tsx 생성**

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRecords } from "@/lib/api-client";
import type { MealRecord } from "@/lib/api-client";
import RecordCard from "./RecordCard";

interface HistoryTabProps {
  userId: string;
  onEdit?: (record: MealRecord) => void;
}

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default function HistoryTab({ userId, onEdit }: HistoryTabProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: records, isLoading } = useQuery({
    queryKey: ["records", userId, formatMonth(year, month)],
    queryFn: () => fetchRecords(userId, formatMonth(year, month)),
  });

  const handlePrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleEdit = (record: MealRecord) => {
    onEdit?.(record);
  };

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-center gap-5 mb-6">
        <button onClick={handlePrev} className="text-gray-400 text-2xl">
          ‹
        </button>
        <span className="text-lg font-bold text-gray-900">
          {year}년 {month}월
        </span>
        <button onClick={handleNext} className="text-gray-400 text-2xl">
          ›
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 text-sm">로딩 중...</p>
      ) : records?.length === 0 ? (
        <p className="text-center text-gray-400 text-sm mt-10">
          기록이 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {records?.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add services/bab-with/src/components/RecordCard.tsx services/bab-with/src/components/HistoryTab.tsx
git commit -m "feat: 히스토리 탭 (월별 조회 + 컴팩트 카드 + 복사)"
```

---

### Task 8: 설정 탭 + 수정/삭제

**Files:**
- Create: `services/bab-with/src/components/SettingsTab.tsx`
- Modify: `services/bab-with/src/pages/index.tsx` — 수정 모드 추가

- [ ] **Step 1: SettingsTab.tsx 생성**

```tsx
interface SettingsTabProps {
  onLogout: () => void;
}

export default function SettingsTab({ onLogout }: SettingsTabProps) {
  const handleLogout = () => {
    if (confirm("다른 사람으로 변경하시겠어요?")) {
      onLogout();
    }
  };

  return (
    <div className="px-5 pt-12">
      <h1 className="text-xl font-bold text-gray-900 mb-6">설정</h1>
      <button
        onClick={handleLogout}
        className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl text-red-500 font-medium border border-gray-100"
      >
        다른 사람으로 변경
      </button>
    </div>
  );
}
```

- [ ] **Step 2: index.tsx 수정 — 수정 모드 추가**

index.tsx를 수정하여 히스토리에서 카드 탭 시 수정/삭제 화면으로 전환:

```tsx
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Onboarding from "@/components/Onboarding";
import RegisterTab from "@/components/RegisterTab";
import HistoryTab from "@/components/HistoryTab";
import SettingsTab from "@/components/SettingsTab";
import MealTypeSelector from "@/components/MealTypeSelector";
import CompanionSelector from "@/components/CompanionSelector";
import {
  fetchUsers,
  updateRecord,
  deleteRecord,
} from "@/lib/api-client";
import type { MealRecord } from "@/lib/api-client";

type Tab = "register" | "history" | "settings";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("register");
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MealRecord | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bab-with-user-id");
    if (stored) setUserId(stored);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null;

  if (!userId) {
    return (
      <Onboarding
        onComplete={(id) => {
          localStorage.setItem("bab-with-user-id", id);
          setUserId(id);
        }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("bab-with-user-id");
    setUserId(null);
    setActiveTab("register");
  };

  if (editingRecord) {
    return (
      <EditRecordView
        record={editingRecord}
        userId={userId}
        onClose={() => setEditingRecord(null)}
      />
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "register" && <RegisterTab userId={userId} />}
      {activeTab === "history" && (
        <HistoryTab userId={userId} onEdit={setEditingRecord} />
      )}
      {activeTab === "settings" && <SettingsTab onLogout={handleLogout} />}
    </Layout>
  );
}

interface EditRecordViewProps {
  record: MealRecord;
  userId: string;
  onClose: () => void;
}

function EditRecordView({ record, userId, onClose }: EditRecordViewProps) {
  const [mealType, setMealType] = useState(record.mealType);
  const [selectedCompanions, setSelectedCompanions] = useState<Set<string>>(
    new Set(record.companions.map((c) => c.userId))
  );

  const queryClient = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRecord(record.id, {
        date: record.date,
        mealType,
        companionIds: Array.from(selectedCompanions),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecord(record.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      onClose();
    },
  });

  const handleToggle = (id: string) => {
    setSelectedCompanions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = () => {
    if (confirm("이 기록을 삭제하시겠어요?")) {
      deleteMutation.mutate();
    }
  };

  const d = new Date(record.date + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const displayDate = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;

  return (
    <div className="flex flex-col h-dvh bg-white max-w-[430px] mx-auto">
      <div className="flex items-center px-5 pt-12 mb-4">
        <button onClick={onClose} className="text-gray-400 text-lg mr-3">
          ← 뒤로
        </button>
        <h1 className="text-lg font-bold text-gray-900">기록 수정</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <p className="text-sm text-gray-400 text-center mb-5">
          {displayDate}
        </p>

        <div className="mb-6">
          <MealTypeSelector value={mealType} onChange={setMealType} />
        </div>

        {users && (
          <CompanionSelector
            users={users}
            selected={selectedCompanions}
            currentUserId={userId}
            onToggle={handleToggle}
          />
        )}
      </div>

      <div className="px-5 pb-8 pt-4 space-y-2">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={
            selectedCompanions.size === 0 || updateMutation.isPending
          }
          className={`w-full py-4 rounded-xl text-base font-semibold ${
            selectedCompanions.size === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white active:bg-blue-700"
          }`}
        >
          {updateMutation.isPending ? "수정 중..." : "수정"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="w-full py-3 rounded-xl text-sm font-medium text-red-500 bg-red-50 active:bg-red-100"
        >
          {deleteMutation.isPending ? "삭제 중..." : "삭제"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: dev 서버에서 전체 플로우 확인**

1. 온보딩 → 이름 선택 → 확인
2. 등록 탭 → 동행자 선택 → 저장
3. 히스토리 탭 → 카드 확인 → 복사 아이콘 → 카드 탭 → 수정/삭제
4. 설정 탭 → "다른 사람으로 변경"

- [ ] **Step 4: Commit**

```bash
git add services/bab-with/src/
git commit -m "feat: 설정 탭 + 기록 수정/삭제 화면"
```

---

### Task 9: PWA 메타 + viewport 설정

**Files:**
- Modify: `services/bab-with/src/pages/_document.tsx`

- [ ] **Step 1: _document.tsx에 모바일 메타 태그 추가**

```tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="application-name" content="bab-with" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="bab-with" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

- [ ] **Step 2: _app.tsx의 Head에 viewport 추가 (또는 next.config.ts에서 설정)**

Next.js 15에서는 viewport가 기본 포함되므로, _document.tsx의 메타만으로 충분. 확인.

- [ ] **Step 3: Commit**

```bash
git add services/bab-with/src/pages/_document.tsx
git commit -m "feat: PWA 메타 태그 (모바일 홈 화면 추가 지원)"
```

---

### Task 10: Vercel 배포

- [ ] **Step 1: .env.local 값을 Vercel 환경변수에 등록**

Vercel 대시보드에서:
- `TURSO_DATABASE_URL` 추가
- `TURSO_AUTH_TOKEN` 추가

- [ ] **Step 2: Vercel 배포**

Run: `cd services/bab-with && npx vercel --prod`

- [ ] **Step 3: 배포 URL에서 모바일 테스트**

모바일 브라우저에서 접속 → 온보딩 → 등록 → 히스토리 → 설정 전체 플로우 확인

- [ ] **Step 4: Commit (deploy script 추가)**

package.json에 deploy 스크립트 추가:

```json
"deploy": "npx vercel --prod"
```

```bash
git add services/bab-with/package.json
git commit -m "chore: Vercel 배포 스크립트 추가"
```
