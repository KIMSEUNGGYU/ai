# FE 하네스 설계 + 구현

## 스펙
- `.ai/specs/fe-harness.md` — 설계 문서 (확정)
- `.ai/specs/fe-harness-plan.md` — 구현 계획 (확정)
- 참고: 앤트로픽 하네스 블로그, Ouroboros

## 작업
- [x] 앤트로픽 하네스 영상 리서치 + 정리
- [x] Ouroboros 리서치
- [x] 방향 논의 (brainstorming)
- [x] 전체 그림 설계
- [x] 각 컴포넌트 세부 설계 (Planner, Generator, Evaluator, Contract, Orchestrator, Eval Log)
- [x] 설계 문서 작성 (fe-harness.md)
- [x] 구현 계획 작성 (fe-harness-plan.md)
- [ ] Part 1: 공유 핵심 (프롬프트 3개 + 템플릿 + config)
- [ ] Part 2: Plugin 구현 (커맨드 4개 + 테스트)
- [ ] Part 3: Service 구현 (fe-harness 서비스 + 테스트)
- [ ] Part 4: 프롬프트 튜닝 + A/B 비교

## 현재 컨텍스트
설계 + 구현 계획 모두 완료. 다음은 구현 시작 (Part 1부터).

## 결정사항
- 3-에이전트 구조: Planner(Opus) + Generator(Sonnet) + Evaluator(Opus) — GAN 영감, Self-Evaluation Bias 해결
- 2가지 구현 비교: Plugin(A) + 독립 서비스 claude -p(B) — 컨텍스트 격리 효과 비교 목적
- Sprint Contract: Generator ↔ Evaluator 사전 합의 — 만들기 전에 완료 기준 명확화
- 파일 기반 통신: 에이전트 간 파일로 소통 — 컨텍스트 격리 + 로그 자동 축적
- Evaluator 3단계: Contract(닫힌) + 열린 평가 + Contrarian — 갇히지 않는 평가
- Sprint 통과 = Contract 전부 pass AND 품질 점수 ≥ 임계값 — 둘 다 충족해야 통과
- 품질 점수 공식: Contract(60%) + 열린(30%) + Contrarian(10%) — 보고서/추적용
- Planner 모호성 체크: 목표(40%) + 제약(30%) + 성공기준(30%) — Ouroboros 영감
- 수렴 감지: 정체(3회 동점) + 진동(N≈N-2) + 피드백 중복 + Hard cap — Ralph 스타일
- Contrarian은 Evaluator 안에 포함 — 별도 에이전트 불필요, 써보고 부족하면 분리
- 커맨드 4개: harness(통합) + planning + implementing + evaluating — superpowers 스타일 개별 호출 가능
- implementing에서 contract 자동 생성 — contract 별도 커맨드 불필요
- 실행 단위 = 페이지 1개, 도메인 단위 그룹핑 — domain-context.md로 공유 설계
- Build Loop는 AI 자율 — 사람 개입은 Planner 후 + 완료 후 + 비정상 종료 시만
- 컨벤션 문서는 설정(harness-config)으로 관리 — 하드코딩 방지, 프로젝트별 유연성
- Orchestrator는 LLM이 아닌 코드 로직 — if/else 분기, 모델 호출 불필요

## 기각된 대안
- Playwright 테스트 (지금 단계) → 기각: 정적 검증 + 코드 패턴 일관성으로 현재 문제의 대부분 해결 가능. 환경 셋업 복잡. 나중에 추가 가능
- Contrarian 별도 에이전트 → 기각: Generator ↔ Evaluator 분리가 핵심. 이중 분리는 비용 대비 가치 불확실
- 기존 fe-workflow 유지하며 확장 → 기각: 기존 시스템에 불만족. 하네스 관점에서 재설계
- Contract를 별도 커맨드로 → 기각: planning이 끝나면 Sprint 계획이 나오고, contract는 Build Loop 내부 단계. 개별 호출할 일 없음
- 점수 공식만으로 pass/fail → 기각: Contract(합의한 기준)와 품질 점수(전체 품질) 모두 충족해야 의미 있음

## 세션 이력
- e20327cc-3241-44c8-a7ff-5edfb54884d5 (2026-03-31 22:30)
