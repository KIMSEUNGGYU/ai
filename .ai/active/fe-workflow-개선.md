# fe-workflow + session-manager 워크플로우 개선

## 스펙
- 목표: superpowers 실행 품질 문제 해결 — FE 컨벤션 주입 + Phase 기반 검증 + 자가학습 강화
- superpowers 사고 스킬(brainstorming 등) 유지, 계획+실행만 fe-workflow로 대체

## 작업
- [x] fe-spec 강화 — Gap Analysis 단계 추가 (빠진 요구사항/모호함/컨텍스트 충돌 질문)
- [x] fe-spec — 스펙 템플릿에 구현 Phases 포함 (검증 기준 + Phase 분리)
- [x] implement — Phase 감지 → Phase별 Agent 위임 (Phase 2A) + 전체 위임 (Phase 2B)
- [x] implement — Agent에 결정사항/컨벤션 변경 반환 형식 지정
- [x] implement — "나머지 전부 진행" 옵션으로 확인 피로 경감
- [x] phase-execution convention 신규 — Phase별 실행 강제 규칙 + 검증 보고 형식
- [x] /done 자가학습 확장 — active 파일 결정사항/컨벤션/스펙변경 → learnings 추출 (2-B 트랙)
- [x] context-system.md — active 파일 포맷에 컨벤션 변경/스펙 변경 섹션 추가
- [x] GUIDE.md — superpowers 하이브리드 워크플로우 사용 가이드
- [x] 2차 검증 (서브에이전트 반박) — Critical/Major 해결 확인
- [x] 커밋 + push 완료
- [ ] 다른 PC에서 `claude plugin update` → 실제 작업에서 검증
- [ ] 검증 결과에 따라 조정

## 현재 컨텍스트
- session-manager v0.14.0, fe-workflow v0.24.0 push 완료
- 2차 검증까지 완료 — 시스템 한계(프롬프트 기반 강제) 외 해결 가능한 문제 모두 수정
- **다음 액션: 다른 PC에서 plugin update → 실제 FE 작업에서 하이브리드 워크플로우 검증**

## 결정사항
- superpowers 사고 스킬 유지 + 계획/실행만 fe-workflow로 대체 (하이브리드)
- Phase 강제는 implement 커맨드에 내장 (convention만으론 강제 불가 — 플랫폼 제약)
- 자가학습: transcript(교정) + active 파일(결정사항) 2트랙 병행
- "나머지 전부 진행" 선택 시에도 active 파일 업데이트는 계속 수행
- phase-execution.md를 보고 형식의 정본(source of truth)으로 지정
- archive 부활 안 함 — 관리 포인트 최소화 원칙 유지

## 플러그인 버전
- session-manager: v0.14.0 (phase-execution convention + done 자가학습 확장)
- fe-workflow: v0.24.0 (fe-spec Gap Analysis + implement Phase 실행 + GUIDE)

## 세션 이력
- 584fa32a-4698-42a0-b990-3c160894e809 (2026-03-10 20:30)
- c154b20d-d107-45bd-9bd8-1b2a7798c950 (2026-03-13 22:00)
