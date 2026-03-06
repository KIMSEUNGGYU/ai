# cc-monitor: Claude Code 팀 모니터링 서비스

> 시작일: 2026-03-04
> 상태: Phase 2 구현 완료 (UI 피드백 반영 중)

## 진행 체크리스트

### Phase 1 — MVP (완료)
- [x] 프로젝트 스캐폴딩 + 타입 + DB + API + 수집 + 대시보드

### Phase 1.5 — Vercel 배포 (완료)
- [x] Demo Mode (mock-data) + Vercel 배포

### Phase 1.7 — DB 전환 (완료)
- [x] better-sqlite3 → Prisma + Turso (libsql) 전환

### Phase 2 — 이벤트 타임라인 강화 (완료)
- [x] 도구 타입별 멀티 필터링 (토글 배지 UI)
- [x] 도구명 툴팁 (호버 시 설명 표시)
- [x] AskUserQuestion 수집 확대 (질문 텍스트 요약)
- [x] mock-data에 새 카테고리 반영
- [x] 다크 테마 가시성 개선
- [x] 필터 UX 개선 (미선택=전체, 선택=해당만)

### 미래 — 추가 개선
- [ ] 실시간 업데이트 (SSE/WebSocket)
- [ ] 차트 라이브러리 적용
- [ ] Vercel 재배포 (Phase 2 반영)

## 현재 컨텍스트
- 브랜치: `feat/cc-monitor-timeline-filter` (8커밋, main 미머지)
- 배포 URL: https://cc-monitor.vercel.app
- DB: Prisma + Turso (libsql), TURSO_DATABASE_URL 없으면 Demo Mode
- 스펙: `.ai/specs/cc-monitor-phase2.md`
- 구현 계획: `docs/plans/2026-03-06-cc-monitor-phase2-timeline-filter.md`

## 결정사항
- 필터링은 프론트엔드에서 처리 (이벤트 전체 로드 후 클라이언트 필터)
- 필터 UX: 빈 Set=전체 표시, 선택하면 해당만 (include 모델)
- 9개 카테고리: Skill/Agent/Bash/File/Search/MCP/Prompt/Session/Question
- AskUserQuestion은 tool_input_summary에 질문 텍스트 저장 (스키마 변경 없음)
- mock-data는 데모/포트폴리오용으로 유지
- 다크 테마 전용 (라이트 모드 미지원)

## 신규 파일
- `src/lib/tool-categories.ts` — 도구→카테고리 매핑 + 색상
- `src/lib/tool-descriptions.ts` — 도구 설명 정적 데이터
- `src/components/ui/tooltip.tsx` — shadcn Tooltip

<!-- last-active: 2026-03-06 -->
