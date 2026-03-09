# fe-workflow 플러그인 개선 — 컨벤션 자동 적용 + 모니터링

## 스펙
- 최종 목표: superpowers로 초안 개발 시 AI가 자동으로 회사 컨벤션을 따르게 → 수동 수정 최소화
- cc-monitor로 Hook 발동 여부 추적 가능하게
- (2차) 하네스로 컨벤션 점수화 + 자동 재수행

## 작업
- [x] 문제 진단 — cc-monitor 대시보드에서 fe-workflow skill/agent 0회 호출 확인
- [x] Hook 추적 구현 — 로컬 로그(~/.claude/logs/fe-hook.log) + cc-monitor PluginHook 이벤트 전송
- [x] cc-monitor PluginHook 타입 추가 — types.ts, event-processor.ts
- [x] fe-principles skill description 강화 — TRIGGER/DO NOT TRIGGER 패턴 + 워크플로우 테이블
- [x] fe-workflow v0.20.0 배포 (push 완료)
- [ ] **다른 PC에서 검증** — plugin update → 실제 FE 개발 → fe-hook.log 확인
- [ ] 검증 결과에 따라: Hook 주입됨 → 컨벤션 문서 표현 개선 / Hook 안 됨 → 디버깅
- [ ] (2차) 하네스 — 컨벤션 점수화 + 자동 재수행 루프

## 현재 컨텍스트
- 이 PC(Mac)에서 할 수 있는 작업 완료 — 코드 변경 + push 완료
- **다음 액션: 다른 PC에서 `claude plugin update` → 실제 개발 → 로그 확인**
- 핵심 의문: Hook이 발동은 되는데 AI가 안 따르는 건지, Hook 자체가 안 발동하는 건지

## 결정사항
- Hook 추적은 로컬 로그 + cc-monitor 이벤트 2트랙
- 기존 events 테이블 재활용 — 별도 테이블 안 만듦
- `/fe:review` 매번 자동 실행은 비효율 → 컨벤션이 적재적소에 주입되는 게 핵심
- description 개선만으로는 100% 보장 불가 — 로그 확인 후 추가 조치 판단

## 메모
- 이 PC에는 fe-workflow 미설치 (다른 PC에만 설치됨)
- cc-monitor 대시보드에 PluginHook 필터/뷰는 아직 없음

## 세션 이력
- 584fa32a-4698-42a0-b990-3c160894e809 (2026-03-10 20:30)
