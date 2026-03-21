# cc-monitor 대시보드 개선

## 스펙

- cc-monitor 대시보드 UX/기능 개선 (개인 프로젝트)
- Vercel 배포: [https://cc-monitor.vercel.app](https://cc-monitor.vercel.app)
- DB: Turso (LibSQL)

## 작업

- ClaudeProbe health check 세션 필터링 (collector + DB 정리 270건)
- nuqs 탭 URL 동기화 (?tab=sessions)
- Sessions: session_id 앞 8자리 노출
- Sessions: 이벤트/토큰 컬럼 정렬 기능
- Analysis 탭: tool_name 기반 Skills/Agents/MCP/Hooks/Tools 분류 시각화
- Analysis 탭: Slash Commands 분류 추가
- 세션 드로어: 프롬프트 비밀번호 인증
- Sessions: task_name 기반 Accordion 그룹핑 UI
- PATCH /api/sessions/[id] + migrate/backfill API
- Plugin Health 섹션 (hook/skill/convention 발동 체크리스트)
- fe-workflow hook에서 실제 컨벤션 파일명 전송 수정 (v0.25.0)
- injection_bytes + active_task 자동 분류
- PluginHealth 주입 비용 시각화 (총 주입/중복 낭비)
- EventTimeline 펼치기 + 드로어 너비 확장 (55%→70%)
- History 탭 (프롬프트 단위 행동 추적)
- docs: 데이터-수집-아키텍처.md, 생명주기-모니터링.md
- mock_data 제거 (mock-data.ts + isDemoMode 전체 삭제, prisma 필수화)
- 이벤트 수집 경량화: PreToolUse 제거 + PostToolUse 로컬 카운팅 확대 (PluginHook은 유지)
- 컨벤션 주입 fingerprint: injection_hash(md5) 수집 + History 표시 (파일명, 바이트, 해시)
- 세션 분류 시스템 개선: readActiveTask 상위 디렉토리 탐색 + project_path 폴백 그룹핑
- History 탭 UI 개선: 그룹 아코디언 메인 + 드로어 상세
- 배포 후 /api/migrate 호출 (task_name 컬럼 생성)
- 배포 후 /api/backfill-tasks 호출 (기존 세션 task_name 백필)
- ~/work/ 프로젝트 필터: fe-convention-prompt.sh에서 ~/work/ 외 프로젝트는 요약만 출력

## 현재 컨텍스트

- 이번 세션에서 대량 작업 완료 (mock_data 제거, 이벤트 경량화, fingerprint, 세션 분류, History UI)
- 미커밋 — 커밋 + push + 배포 필요
- fe-workflow v0.29.0 (injection_hash 추가) — push + plugin update 필요
- settings.json에서 PreToolUse hook 제거됨 — 새 세션부터 적용

## 결정사항

- ClaudeProbe 필터링은 collector(send-event.ts)에서 처리 — 서버 부하 없이 로컬에서 차단
- Analysis 데이터는 기존 tool_name에서 추출 — 별도 필드 수집 불필요
- nuqs는 Pages Router adapter 사용 (NuqsAdapter in _app.tsx)
- task_name 그룹핑은 session-manager active 파일의 세션 이력 활용
- Plugin Health는 cc-monitor(호출 여부) + fe-workflow /review(품질 검증) 역할 분담
- num_turns 0 체크 로직 되돌림 — SessionEnd 미전송 부작용
- mock_data 유지 제안 → 사용자 거부 → 전체 제거 (isDemoMode + mock-data.ts + 26곳 분기)
- 이벤트 경량화: isLightTool 화이트리스트 → isServerRequired 블랙리스트로 반전 (Skill/Agent/mcp/plugin만 서버 전송)
- 세션 분류: task_name 없을 때 project_path basename으로 자동 그룹핑 — 추가 사용자 행동 불필요
- readActiveTask: cwd에서만 찾던 것을 상위 디렉토리 탐색으로 수정 — 하위 디렉토리에서도 active_task 감지

## 세션 이력

- b1bd2f2a-2753-4e8f-9e09-3ebe5c097eb9 (2026-03-13 14:20)
- 42f4f532-9003-47b7-a634-022cf595c58c (2026-03-14 03:45)
- 981e1231-50d7-428c-a9b6-387c542918d6 (2026-03-15 14:04)
- 9433f6de-804f-4c8b-8111-fd78143c153a (2026-03-15 17:35)


### 아이디어 
- cc-monitor 에서 대화 내용을 하루에 한번 추출해서 무엇을 했는지 피드백 같은 것을  해주는 것을할까? 