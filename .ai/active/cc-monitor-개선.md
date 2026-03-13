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
- [x] Analysis 탭: Slash Commands 분류 추가
- [x] 세션 드로어: 프롬프트 비밀번호 인증
- [x] Sessions: task_name 기반 Accordion 그룹핑 UI
- [x] PATCH /api/sessions/[id] + migrate/backfill API
- [x] Plugin Health 섹션 (hook/skill/convention 발동 체크리스트)
- [x] fe-workflow hook에서 실제 컨벤션 파일명 전송 수정 (v0.25.0)
- [ ] 배포 후 /api/migrate 호출 (task_name 컬럼 생성)
- [ ] 배포 후 /api/backfill-tasks 호출 (기존 세션 task_name 백필)
- [ ] mock_data 제거 검토 (turso DB 있으므로)

## 현재 컨텍스트
- 커밋 완료, push 완료 (origin/main)
- fe-workflow v0.25.0 push 완료 — plugin update 필요 (새 세션에서)

## 결정사항
- ClaudeProbe 필터링은 collector(send-event.ts)에서 처리 — 서버 부하 없이 로컬에서 차단
- Analysis 데이터는 기존 tool_name에서 추출 — 별도 필드 수집 불필요
- nuqs는 Pages Router adapter 사용 (NuqsAdapter in _app.tsx)
- task_name 그룹핑은 session-manager active 파일의 세션 이력 활용
- Plugin Health는 cc-monitor(호출 여부) + fe-workflow /review(품질 검증) 역할 분담
- num_turns 0 체크 로직 되돌림 — SessionEnd 미전송 부작용

## 세션 이력
- b1bd2f2a-2753-4e8f-9e09-3ebe5c097eb9 (2026-03-13 14:20)
- 42f4f532-9003-47b7-a634-022cf595c58c (2026-03-14 03:45)
