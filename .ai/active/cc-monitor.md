# cc-monitor: Claude Code 팀 모니터링 서비스

> 시작일: 2026-03-04
> 상태: Phase 3 진행 중 (worktree: feat/cc-monitor-phase3)

## 진행 체크리스트

### Phase 1 — MVP
- [x] 프로젝트 스캐폴딩 + 타입 + DB + API + 대시보드
- [x] 수집 스크립트 + Hook 설정 + 빌드/동작 검증

### Phase 1.5 — Vercel 배포 (Demo Mode)
- [x] mock-data + isDemoMode() + Vercel 배포 완료

### Phase 2 — v2 (수집 개선 + 대시보드 재구성)
- [x] send-event.ts enrichment 수집기
- [x] Session 스키마 v2 (config + tool_summary 컬럼 추가)
- [x] events.ts enriched 이벤트 저장
- [x] 4탭 대시보드 (Overview / Cost / Sessions / Config)
- [x] 미사용 컴포넌트 정리

### Phase 3 — 진행 중
- [x] **세션 상세 Drawer** (오른쪽 55% 슬라이드, Esc 닫기, 토큰+도구+프롬프트+이벤트 타임라인)
- [x] **Turso DB v2 컬럼 추가** (ALTER TABLE로 9개 컬럼 직접 추가)
- [x] **토큰/Cost 수집 수정** (events.ts Stop/SessionEnd 로직 통합 + 로깅)
- [x] **기존 세션 토큰 backfill** (16개 세션 transcript 파싱 → DB 업데이트)
- [x] **Tool LIMIT 10→30** (Skill 등 필터 드롭다운 노출)
- [x] **Skills 수집 확인** (이미 정상 수집, Drawer 도구 요약에 events 기반 집계 합산)
- [x] **Overview ActiveSessions 제거** (Sessions 탭과 중복)
- [x] **세션 정렬** (active 먼저 + 최신 활동일 기준 내림차순)
- [x] **Sessions 탭: 전체 세션 표시** (active만 → all)
- [x] **날짜 컬럼 추가** + 사용자 컬럼 제거
- [x] **max-w-[1200px] 제거** (전체 너비)
- [x] **postinstall에 prisma generate 추가**
- [x] **main에 v2 코드 push** → Vercel 자동 배포
- [ ] mock-data에 config/tool_summary 필드 추가 (Demo Mode 대응)
- [ ] 차트 라이브러리 적용 (비용 추이, 활동 차트)
- [ ] 실시간 업데이트 (SSE)

## 현재 컨텍스트
- **worktree**: `.worktrees/cc-monitor-fixes` (브랜치: feat/cc-monitor-phase3, main 기반)
- **main에 push 완료**: 세션 Drawer + 토큰 저장 수정 + Tool LIMIT (커밋 2e2f3ff)
- **worktree 커밋 6개**: Skill 합산, ActiveSessions 제거, 정렬, 전체 세션, 날짜 컬럼 등
- **worktree → main 머지 필요** (feat/cc-monitor-phase3 → main)
- Vercel 배포 URL: https://cc-monitor.vercel.app
- .env 복사 필요: worktree에는 .env가 gitignore라 수동 복사

## 결정사항
- Overview ActiveSessions 제거 — Sessions 탭 Drawer로 통합 (중복 제거)
- Drawer UI 채택 — inline 확장 대신 오른쪽 55% 슬라이드 패널
- 도구 요약 합산 — tool_summary(경량 카운터) + events PostToolUse 집계
- 세션 정렬: active → ended, 최신 활동일(ended_at ?? started_at) DESC
- postinstall에 prisma generate — worktree에서도 바로 실행 가능
- backfill 스크립트 — 1회성 /tmp/backfill-tokens.js, 커밋 불필요

## 메모
- Vercel 재배포 후 새 세션부터 토큰 자동 수집됨
- 기존 세션 중 transcript 파일 없는 7개는 backfill 불가 (삭제된 transcript)

<!-- last-active: 2026-03-06 04:30 -->
