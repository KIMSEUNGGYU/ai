# cc-monitor: Claude Code 팀 모니터링 서비스

> 시작일: 2026-03-04
> 상태: Phase 2 완료 + main 머지 완료

## 진행 체크리스트

### Phase 1 — MVP (완료)
- [x] 프로젝트 스캐폴딩 + 타입 + DB + API + 수집 + 대시보드

### Phase 1.5 — Vercel 배포 (완료)
- [x] Demo Mode (mock-data) + Vercel 배포

### Phase 1.7 — DB 전환 (완료)
- [x] better-sqlite3 → Prisma + Turso (libsql) 전환

### Phase 2 — 이벤트 타임라인 강화 (완료, main 머지됨)
- [x] 도구 타입별 멀티 필터링 (토글 배지 UI)
- [x] 도구명 툴팁 (호버 시 설명 표시)
- [x] AskUserQuestion 수집 확대 (질문 텍스트 요약)
- [x] mock-data에 새 카테고리 반영
- [x] 다크 테마 가시성 개선
- [x] 필터 UX 개선 (미선택=전체, 선택=해당만)
- [x] main 머지 + 푸시

### 미래 — 추가 개선
- [ ] 실시간 업데이트 (SSE/WebSocket)
- [ ] 차트 라이브러리 적용
- [ ] Vercel 자동 배포 확인

## 현재 컨텍스트
- 브랜치: `main` (Phase 2 머지 완료)
- 배포 URL: https://cc-monitor.vercel.app
- DB: Prisma + Turso (libsql), TURSO_DATABASE_URL 없으면 Demo Mode
- 스펙: `.ai/specs/cc-monitor-phase2.md`
- `.gitignore`에 `*.tsbuildinfo` 추가 완료

## 결정사항
- 필터링은 프론트엔드에서 처리 (이벤트 전체 로드 후 클라이언트 필터)
- 필터 UX: 빈 Set=전체 표시, 선택하면 해당만 (include 모델)
- 9개 카테고리: Skill/Agent/Bash/File/Search/MCP/Prompt/Session/Question
- AskUserQuestion은 tool_input_summary에 질문 텍스트 저장 (스키마 변경 없음)
- mock-data는 데모/포트폴리오용으로 유지
- 다크 테마 전용 (라이트 모드 미지원)
- main 직접 머지 (PR 패턴 권장 → 다음부터 PR로)

## 신규 파일
- `src/lib/tool-categories.ts` — 도구→카테고리 매핑 + 색상
- `src/lib/tool-descriptions.ts` — 도구 설명 정적 데이터
- `src/components/ui/tooltip.tsx` — shadcn Tooltip

<!-- last-active: 2026-03-06 -->

하고 싶은거? / 해야하는거
- 바이브 코딩으로 해서 모니터링 에 데이터를 어떤 파일 읽어서 CC 가 어떻게 동작하길래 수집할 수 있는지?
- 그리고 어떤 데이터들을 수집하고 잇는지 등등 공부 필요 