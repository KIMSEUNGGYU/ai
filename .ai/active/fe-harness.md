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
- [x] Part 1: 공유 핵심 (프롬프트 3개 + 템플릿 + config)
- [x] Part 2: Plugin 구현 (커맨드 4개 + version bump v0.35.0)
- [x] Plugin 검증 1차 — Critical 수정 (color, Step 번호)
- [x] Plugin 동작 테스트 (/fe:planning 정상 동작 확인)
- [x] Generator 신규 작성 (code-writer 대체) — 하네스 전용, 자기검증 제거
- [x] Contract 초안 생성을 Generator → Planner로 변경
- [x] Plugin 검증 2차 — Critical(_backup 이동), Major(README/SKILL), Minor(경로 명시)
- [x] 기존 커맨드/에이전트 backup 처리 (.ai/backup/fe-workflow/)
- [x] Part 3: Service 구현 (fe-harness 독립 서비스)
- [x] SDK 마이그레이션: claude -p → @anthropic-ai/claude-agent-sdk
- [x] 루프 개선: Evaluator D단계(Contract 검토) 추가 — Plugin + Service 양쪽
- [x] 문서화: Claude 모델 호출 방식 비교 + decisions 기록
- [ ] Part 4: 프롬프트 튜닝 + A/B 비교

## 현재 컨텍스트
Part 3 완료. SDK 마이그레이션 + 루프 개선(Ouroboros 영감) 적용. 다음은 Part 4 (실전 테스트 + 프롬프트 튜닝).

## 결정사항
- 3-에이전트 구조: Planner(Opus) + Generator(Opus) + Evaluator(Opus) — GAN 영감, Self-Evaluation Bias 해결
- 2가지 구현 비교: Plugin(A) + 독립 서비스 claude -p(B) — 컨텍스트 격리 효과 비교 목적
- Sprint Contract: Generator ↔ Evaluator 사전 합의 — 만들기 전에 완료 기준 명확화
- 파일 기반 통신: 에이전트 간 파일로 소통 — 컨텍스트 격리 + 로그 자동 축적
- Evaluator 4단계: Contract(닫힌) + 열린 평가 + Contrarian + Contract 검토 — 갇히지 않는 평가
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
- disallowedTools 패턴 통일 — planner, evaluator에 disallowedTools 사용 (기존 에이전트와 일관성)
- Generator 신규 작성 — 기존 code-writer 확장이 아닌 하네스 전용으로 새로 설계. 자기검증 제거 (Evaluator가 담당), contract 범위 엄수에 집중
- Contract 초안 생성 = Planner — spec을 만든 에이전트가 contract도 가장 잘 정의. Generator(구현 전용)는 contract 작성에 부적합
- implementing 개별 호출 시 Eval Loop 미포함 — harness가 Build Loop를 소유. 개별 호출 시 /fe:evaluating을 따로 실행
- _backup은 플러그인 밖으로 — .ai/backup/fe-workflow/. 플러그인 자동 탐색에 잡히지 않도록
- 독립 서비스(B) 호출: claude -p 대신 Claude Agent SDK — 구독 과금 + 스트리밍/세션 resume. morning-brief와 동일 패턴
- 루프 개선: Evaluator가 contract 자체 부실 여부도 판단 — Ouroboros의 Wonder/Reflect에서 영감. 코드가 아닌 기준이 문제일 때 감지

## 기각된 대안
- Playwright 테스트 (지금 단계) → 기각: 정적 검증 + 코드 패턴 일관성으로 현재 문제의 대부분 해결 가능. 환경 셋업 복잡. 나중에 추가 가능
- Contrarian 별도 에이전트 → 기각: Generator ↔ Evaluator 분리가 핵심. 이중 분리는 비용 대비 가치 불확실
- 기존 fe-workflow 유지하며 확장 → 기각: 기존 시스템에 불만족. 하네스 관점에서 재설계
- Contract를 별도 커맨드로 → 기각: planning이 끝나면 Sprint 계획이 나오고, contract는 Build Loop 내부 단계. 개별 호출할 일 없음
- 점수 공식만으로 pass/fail → 기각: Contract(합의한 기준)와 품질 점수(전체 품질) 모두 충족해야 의미 있음
- harness- prefix 네이밍 → 기각: superpowers 스타일(동사형 -ing) 채택. harness-planning보다 planning이 직관적
- code-writer 확장(하네스 모드 추가) → 기각: 기존 code-writer가 문제의 원인(35% 패턴 불일치). 같은 프롬프트에 모드 추가는 근본 해결이 아님. 하네스 전용 generator 신규 작성
- implementing에 Eval Loop 통합 → 기각: harness가 Build Loop를 소유하는 게 설계 의도. implementing에 넣으면 harness와 로직 중복

## 메모
- plugin update 후 새 세션에서 반영됨
- git push 필요: `gh auth switch --user KIMSEUNGGYU` 확인

## 세션 이력
- e20327cc-3241-44c8-a7ff-5edfb54884d5 (2026-03-31 22:30)
