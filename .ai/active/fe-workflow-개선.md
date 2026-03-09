# fe-workflow + dev-workflow 플러그인 개선

## 스펙
- 최종 목표: superpowers로 초안 개발 시 AI가 자동으로 회사 컨벤션을 따르게 → 수동 수정 최소화
- cc-monitor로 Hook 발동 여부 추적 가능하게
- dev-workflow 플러그인 분리 — 범용 PR/커밋 워크플로우
- (2차) 하네스로 컨벤션 점수화 + 자동 재수행

## 작업
- [x] 문제 진단 — cc-monitor 대시보드에서 fe-workflow skill/agent 0회 호출 확인
- [x] Hook 추적 구현 — 로컬 로그(~/.claude/logs/fe-hook.log) + cc-monitor PluginHook 이벤트 전송
- [x] cc-monitor PluginHook 타입 추가 — types.ts, event-processor.ts
- [x] fe-principles skill description 강화 — TRIGGER/DO NOT TRIGGER 패턴 + 워크플로우 테이블
- [x] `/fe:pr` → `/dev:pr` 분리 — dev-workflow 플러그인 신규 생성 (v0.2.0)
- [x] `/dev:auto` 추가 — 완전 자동 PR (티켓→브랜치→커밋→push→PR), Linear 선택적
- [x] `validate-attribution.sh` — Claude attribution 차단 hook
- [ ] **다른 PC에서 검증** — fe-workflow plugin update + dev-workflow plugin install → 실제 개발 → 로그 확인
- [ ] 검증 결과에 따라: Hook 주입됨 → 컨벤션 문서 표현 개선 / Hook 안 됨 → 디버깅
- [ ] (2차) 하네스 — 컨벤션 점수화 + 자동 재수행 루프

## 현재 컨텍스트
- 이 PC에서 할 수 있는 작업 완료 — 코드 변경 + push 완료
- **다음 액션: 다른 PC에서 plugin update/install → 실제 개발 → 로그 확인**

## 결정사항
- Hook 추적은 로컬 로그 + cc-monitor 이벤트 2트랙
- PR/커밋 워크플로우는 dev-workflow로 분리 — FE 컨벤션과 무관한 범용 기능
- `/dev:auto`에서 Linear MCP 있으면 티켓 자동 생성, 없으면 스킵 (범용성 유지)
- 타입 자동 판별 (fix 고정 → feat/fix/refactor/chore)
- 기존 PR 업데이트 시 body 덮어쓰기 아닌 기존 유지 + 신규 추가
- description 개선만으로는 100% 보장 불가 — 로그 확인 후 추가 조치 판단

## 플러그인 버전
- fe-workflow: v0.21.1 (컨벤션 + 리뷰 + 설계)
- dev-workflow: v0.2.0 (PR + 커밋 검증 + attribution 차단)

## 메모
- 이 PC에는 fe-workflow 미설치 (다른 PC에만 설치됨)
- dev-workflow도 다른 PC에서 `claude plugin install` 필요
- cc-monitor 대시보드에 PluginHook 필터/뷰는 아직 없음
- Linear MCP 인증 끊김 이슈 → 필요 시 Personal API Key + Keychain 방식 전환 검토

## 세션 이력
- 584fa32a-4698-42a0-b990-3c160894e809 (2026-03-10 20:30)
