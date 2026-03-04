# cc-monitor: Claude Code 팀 모니터링 서비스

> 시작일: 2026-03-04
> 상태: Vercel 배포 완료 (Demo Mode)

## 진행 체크리스트

### Phase 1 — MVP
- [x] 프로젝트 스캐폴딩 (package.json, tsconfig, next.config)
- [x] 타입 정의 (types.ts)
- [x] DB 레이어 (SQLite 연결 + 스키마 + 쿼리)
- [x] API Routes (events, sessions, analytics, feed)
- [x] 수집 스크립트 (collector/send-event.ts)
- [x] Hook 설정 예시 (hooks-config.example.json)
- [x] 대시보드 UI (Pages Router)
- [x] Hook 설치 스크립트
- [x] 루트 package.json 스크립트 추가
- [x] 빌드 검증 (next build 성공)
- [x] 동작 검증 (send-event.ts + API + DB + 대시보드 전체 파이프라인 확인)

### Phase 1.5 — Vercel 배포 (Demo Mode)
- [x] mock-data.ts 생성 (전체 쿼리 함수 대응)
- [x] db.ts 수정 — better-sqlite3 동적 로드, isDemoMode() export
- [x] queries.ts — 모든 함수에 demo mode 가드
- [x] adoption-queries.ts — demo mode 가드
- [x] cost-queries.ts — demo mode 가드
- [x] package.json — better-sqlite3 → optionalDependencies
- [x] next.config.ts — serverExternalPackages 조건부
- [x] index.tsx — Demo Mode 배지 표시
- [x] VERCEL=1 pnpm build 로컬 검증
- [x] Vercel 배포 완료

### Phase 2 — 개선 (미정)
- [ ] MySQL + Prisma 전환 (Vercel에서 실제 데이터 사용)
- [ ] 실시간 업데이트 (SSE/WebSocket)
- [ ] 차트 라이브러리 적용
- [ ] 세션 상세 페이지

## 현재 컨텍스트
- 배포 URL: https://cc-monitor.vercel.app
- Vercel scope: kimseunggyus-projects
- Demo Mode로 동작 중 (mock 데이터 표시)
- 로컬에서는 기존 SQLite 그대로 동작

## 결정사항
- Demo Mode 패턴 채택 — Vercel serverless에서 better-sqlite3 네이티브 바이너리 불가, mock 데이터로 UI 우선 배포
- better-sqlite3를 optionalDependencies로 이동 — Vercel에서 설치 실패해도 빌드 진행
- isDemoMode() = process.env.VERCEL || getDb() === null — 두 조건 모두 체크

## 학습 메모

### Claude Code Hooks
- `command` 타입만 지원 (HTTP hook 없음)
- stdin으로 JSON 이벤트 전달
- 이벤트: SessionStart, SessionEnd, PreToolUse, PostToolUse, UserPromptSubmit, Stop
- timeout 초과 시 non-blocking error (Claude Code 동작에 영향 없음)

### 기술 선택
- Next.js Pages Router — App Router보다 익숙, API Routes 간단
- better-sqlite3 — 동기 API, WAL 모드로 동시 읽기, 배포 단순
- Hono 대신 Next.js — FE+BE 한 프로젝트, FE 개발자로서 익숙

### pnpm 빌드 관련
- better-sqlite3는 네이티브 모듈이라 `pnpm approve-builds`가 필요
- `.npmrc`에 `onlyBuiltDependencies[]=better-sqlite3` 설정
- Next.js에서 네이티브 모듈 사용 시 `serverExternalPackages` 설정 필요

### 타입 이슈
- 유니온 타입에서 switch/case로 narrowing할 때 optional 필드가 `{} | null`로 추론되는 이슈
- `"model" in event && typeof event.model === "string"` 같은 타입 가드로 해결

### Vercel 배포 관련
- better-sqlite3 타입: `import("better-sqlite3").Database`로 타입만 참조, 런타임은 require로 동적 로드
- Vercel에서 `serverExternalPackages` 설정하면 해당 모듈을 찾으려 해서 에러 → 조건부로 제거

<!-- last-active: 2026-03-04 21:35 -->
