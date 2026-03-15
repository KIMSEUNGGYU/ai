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
- [x] injection_bytes + active_task 자동 분류
- [x] PluginHealth 주입 비용 시각화 (총 주입/중복 낭비)
- [x] EventTimeline 펼치기 + 드로어 너비 확장 (55%→70%)
- [x] History 탭 (프롬프트 단위 행동 추적)
- [x] docs: 데이터-수집-아키텍처.md, 생명주기-모니터링.md
- [ ] 배포 후 /api/migrate 호출 (task_name 컬럼 생성)
- [ ] 배포 후 /api/backfill-tasks 호출 (기존 세션 task_name 백필)
- [ ] mock_data 제거 검토 (turso DB 있으므로)
- [ ] 이벤트 수집 경량화: PreToolUse 제거 + PostToolUse 로컬 카운팅 확대 (PluginHook은 유지)
- [ ] 컨벤션 주입 fingerprint: injection_hash(md5) 수집 + History 표시 (파일명, 바이트, 해시)
- [ ] ~/work/ 프로젝트 필터: fe-convention-prompt.sh에서 ~/work/ 외 프로젝트는 요약만 출력

## 현재 컨텍스트
- 3커밋 push 완료 (injection_bytes, EventTimeline, History 탭)
- fe-workflow v0.28.0 push 완료 — plugin update 필요 (새 세션에서)
- History 탭 스펙: .ai/specs/cc-monitor-history-tab.md
- 수동 배포 필요 (Vercel 자동배포 미설정)

## 결정사항
- ClaudeProbe 필터링은 collector(send-event.ts)에서 처리 — 서버 부하 없이 로컬에서 차단
- Analysis 데이터는 기존 tool_name에서 추출 — 별도 필드 수집 불필요
- nuqs는 Pages Router adapter 사용 (NuqsAdapter in _app.tsx)
- task_name 그룹핑은 session-manager active 파일의 세션 이력 활용
- Plugin Health는 cc-monitor(호출 여부) + fe-workflow /review(품질 검증) 역할 분담
- num_turns 0 체크 로직 되돌림 — SessionEnd 미전송 부작용

## 결정사항 (이번 세션)
- 컨벤션 주입 신뢰성 확보: injection_hash(md5)로 fingerprint 수집 → 파일 변경 감지
- 전문 DB 저장(B안) 기각 → hash로 충분, DB 낭비 불필요
- 이벤트 경량화: PreToolUse 제거, PostToolUse 로컬 카운팅 확대 (PluginHook은 유지)
- 컨벤션 주입 효과: API 계층만 효과 있음, 컴포넌트/로직은 하네스(기계적 검증)가 근본 해결

## 세션 이력
- b1bd2f2a-2753-4e8f-9e09-3ebe5c097eb9 (2026-03-13 14:20)
- 42f4f532-9003-47b7-a634-022cf595c58c (2026-03-14 03:45)
- 981e1231-50d7-428c-a9b6-387c542918d6 (2026-03-15 14:04)
