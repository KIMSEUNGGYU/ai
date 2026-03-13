# CLAUDE.md - cc-monitor

## 프로젝트 개요

Claude Code 사용 모니터링 대시보드. QA/운영용.

- **스택**: Next.js 15 (Pages Router) + Prisma + SQLite (turso/libsql) + Tailwind + Shadcn
- **배포**: Vercel

## 개발 명령어

- `npm run dev` — 개발 서버
- `npm run build` — 빌드
- `npx prisma generate` — Prisma 타입 생성
- `npx prisma db push` — DB 스키마 반영

## 디렉토리 구조

```
src/
├── pages/
│   ├── api/           # API Routes
│   └── *.tsx          # 페이지
├── lib/
│   ├── db.ts          # Prisma Client 싱글톤
│   ├── queries.ts     # DB 쿼리 함수
│   ├── remotes.ts     # API 통신
│   └── types.ts       # 타입 정의
├── components/        # UI 컴포넌트
prisma/
└── schema.prisma      # 스키마 정의
```

## 코드 컨벤션

### 필수 참조

- **백엔드 원칙**: `~/hq/20_Learn/backend-principles.md`
- **Next.js + Prisma 가이드**: `~/hq/20_Learn/nextjs-prisma-backend-guide.md`

### 핵심 규칙

- `any` 금지 -> `unknown` 또는 제네릭
- 함수 <= 30줄, 파라미터 <= 3개 (넘으면 옵션 객체)
- 조기 반환 (Early Return)
- `match()` 패턴 (ts-pattern) — if-else 체인 대신
- N+1 쿼리 금지 -> Prisma `include` 사용
- API Route에서 Prisma 직접 호출 금지 -> lib/queries 경유

### 네이밍

| 타입 | 컨벤션 |
|------|--------|
| 파일/디렉토리 | kebab-case |
| 컴포넌트/클래스 | PascalCase |
| 함수/변수 | camelCase |
| 상수 | UPPER_SNAKE_CASE |

### 검증

- Zod 스키마로 API 요청 검증
- `z.infer<>`로 타입 파생 (별도 인터페이스 불필요)
