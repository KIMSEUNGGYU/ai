# cc-monitor: Claude Code 팀 모니터링 서비스

> 시작일: 2026-03-04
> 상태: v2 구현 완료 (로컬 테스트 + 배포 필요)

## 진행 체크리스트

### Phase 1 — MVP
- [x] 프로젝트 스캐폴딩 + 타입 + DB + API + 대시보드
- [x] 수집 스크립트 + Hook 설정 + 빌드/동작 검증

### Phase 1.5 — Vercel 배포 (Demo Mode)
- [x] mock-data + isDemoMode() + Vercel 배포 완료

### Phase 2 — v2 (수집 개선 + 대시보드 재구성)
- [x] send-event.ts enrichment 수집기
  - [x] 경량 도구 카운터 (Read/Edit/Glob/Grep/Write → 로컬 파일 캐시)
  - [x] transcript 파싱을 collector로 이동 (서버 로컬 의존 제거)
  - [x] SessionStart config 수집 (CLAUDE.md, rules, MCP, hooks)
- [x] Session 스키마 v2 (config + tool_summary 컬럼 추가)
- [x] events.ts enriched 이벤트 저장
- [x] 4탭 대시보드 (Overview / Cost / Sessions / Config)
  - [x] TabNav 컴포넌트
  - [x] Overview: ActiveSessions + ToolUsage + HourlyActivity + TokenUsage
  - [x] Cost: CostTracking
  - [x] Sessions: 세션 테이블 + inline 상세 (토큰, tool_summary)
  - [x] Config: 사용자별 설정 카드 + MCP 채택률
- [x] 미사용 컴포넌트 정리 (Adoption 3개, PromptLog 4개, transcript-parser 삭제)

### Phase 3 — 남은 작업
- [ ] **세션 클릭 → 작업 로그 상세** (Overview의 ActiveSessions 카드 클릭 시 이벤트 타임라인 + 토큰 + tool_summary + 프롬프트 표시)
- [ ] **Skills 수집** (현재 Skill 도구 사용이 수집되지 않는 문제 — send-event.ts에서 Skill을 경량 도구에서 제외했는지 확인, event-processor의 summarizeToolInput에서 Skill 처리 확인)
- [ ] Prisma db push (Turso에 새 컬럼 반영)
- [ ] Vercel 재배포
- [ ] 실제 데이터로 전체 파이프라인 E2E 테스트
- [ ] mock-data에 config/tool_summary 필드 추가 (Demo Mode 대응)
- [ ] 차트 라이브러리 적용 (비용 추이, 활동 차트)
- [ ] 실시간 업데이트 (SSE)

## 현재 컨텍스트
- v2 구현 완료 (5개 커밋, main 브랜치)
- 배포 URL: https://cc-monitor.vercel.app (아직 v1)
- 핵심 변경: send-event.ts가 로컬에서 enrichment 후 원격 전송
- collector/: tool-counter.ts, transcript-reader.ts, config-reader.ts 신규
- 설계 문서: docs/plans/2026-03-06-cc-monitor-v2-design.md

## 결정사항
- send-event.ts enrichment 패턴 — 로컬 hook이 데이터를 가공하여 원격 서버는 저장만
- 경량 도구(Read/Edit/Glob/Grep/Write) 카운트만 수집 — 개별 이벤트 저장은 노이즈
- transcript 파싱을 collector로 이동 — Vercel에서 로컬 파일 접근 불가 문제 해결
- 4탭 대시보드 — Overview/Cost/Sessions/Config (기존 단일 페이지에서 분리)
- Adoption 컴포넌트 제거 — Overview KPI로 축소, 과도한 메트릭 정리
- claude-hud 참고 — config-reader.ts는 HUD의 config-reader 로직 기반

## 학습 메모

### claude-hud 데이터 소스
- Usage %: OAuth API (api.anthropic.com/api/oauth/usage) — 구독 사용률
- Tool 사용: transcript JSONL 파싱
- Config 카운트: 파일시스템 읽기 (settings.json, .mcp.json 등)
- 토큰 수: transcript의 message.usage

### 경량 도구 카운터 패턴
- send-event.ts는 매번 새 프로세스 → 파일 기반 캐시 (/tmp/cc-monitor-{session_id}.json)
- PostToolUse만 카운트 (Pre는 무시 — 중복 방지)
- Stop/SessionEnd 시 캐시 읽고 삭제

<!-- last-active: 2026-03-05 18:56 -->
