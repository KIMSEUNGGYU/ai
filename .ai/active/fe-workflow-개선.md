# fe-workflow + session-manager 워크플로우 개선

## 스펙
- 목표: superpowers 실행 품질 문제 해결 — FE 컨벤션 주입 + Phase 기반 검증 + 자가학습 강화
- superpowers 사고 스킬(brainstorming 등) 유지, 계획+실행만 fe-workflow로 대체

## 작업
- [x] fe-spec 강화 — Gap Analysis 단계 추가
- [x] implement — Phase 감지 → Phase별 Agent 위임
- [x] implement — Agent에 결정사항/컨벤션 변경 반환 형식 지정
- [x] phase-execution convention 신규
- [x] /done 자가학습 확장
- [x] context-system.md, GUIDE.md
- [x] 2차 검증 (서브에이전트 반박)
- [x] 커밋 + push 완료
- [ ] 다른 PC에서 `claude plugin update` → 실제 작업에서 검증
- [ ] 검증 결과에 따라 조정
- [ ] **구현 후 셀프 리뷰 자동화** — 4번 루프(검토→수정 반복) 줄이기

## 현재 컨텍스트
- session-manager v0.14.0, fe-workflow v0.24.0 push 완료
- **새 방향 논의**: AI 구현 품질 문제 → Mastra/SDK가 아닌 플러그인 셀프 리뷰로 해결
  - 컨벤션은 잘 정의되어 있으나, AI가 상황별 적용 판단을 못함
  - 해결책: (1) 기존 유사 코드 참조 강제 (2) 구현 후 Yes/No 체크리스트 셀프 리뷰 (3) 기존 코드 패턴 대조
  - Mastra는 시스템 자동화(Linear→PR, 슬랙봇)용이라 이 문제의 답이 아님

## 결정사항
- superpowers 사고 스킬 유지 + 계획/실행만 fe-workflow로 대체 (하이브리드)
- Phase 강제는 implement 커맨드에 내장
- 자가학습: transcript(교정) + active 파일(결정사항) 2트랙 병행
- phase-execution.md를 보고 형식의 정본으로 지정
- **Mastra는 현재 유스케이스(코딩 에이전트)에 불필요 — 시스템 자동화 시점에 재검토**
- **품질 개선은 플러그인 셀프 리뷰 단계 추가로 접근 (SDK 에이전트 불필요)**

## 플러그인 버전
- session-manager: v0.14.0
- fe-workflow: v0.24.0

## 세션 이력
- 584fa32a-4698-42a0-b990-3c160894e809 (2026-03-10 20:30)
- c154b20d-d107-45bd-9bd8-1b2a7798c950 (2026-03-13 22:00)
- 334c208c-df11-4bb2-beef-38cd813dbde3 (2026-03-14 23:30)
