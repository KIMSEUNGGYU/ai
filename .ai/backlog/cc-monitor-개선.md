# cc-monitor 대시보드 개선

## 스펙
- cc-monitor 대시보드 UX/기능 개선 (개인 프로젝트)
- Vercel 배포: https://cc-monitor.vercel.app
- DB: Turso (LibSQL)

## 작업
- [x] ClaudeProbe health check 세션 필터링 (collector + DB 정리 270건)
- [x] nuqs 탭 URL 동기화 (?tab=sessions)
- [x] Sessions: session_id 앞 8자리 노출
- [x] Sessions: 이벤트/토큰 컬럼 정렬 기능
- [x] Analysis 탭: tool_name 기반 Skills/Agents/MCP/Hooks/Tools 분류 시각화
- [ ] 추가 개선 (사용자 요청 대기 중)

## 현재 컨텍스트
- 커밋 완료: `73d3fce` (ClaudeProbe 필터), `0af9cac` (대시보드 개선)
- 배포 대기 중 (사용자가 추가 작업 후 배포 예정)
- Analysis API: `/api/analysis` — tool_input_summary 파싱으로 Skill/Agent/Hook 분류

## 결정사항
- ClaudeProbe 필터링은 collector(send-event.ts)에서 처리 — 서버 부하 없이 로컬에서 차단
- Analysis 데이터는 기존 tool_name에서 추출 — 별도 필드 수집 불필요
- nuqs는 Pages Router adapter 사용 (NuqsAdapter in _app.tsx)

## 세션 이력
- b1bd2f2a-2753-4e8f-9e09-3ebe5c097eb9 (2026-03-13 14:20)
