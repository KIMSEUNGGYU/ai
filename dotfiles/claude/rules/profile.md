# 사용자 판단 프로파일

> /done 시 자가학습으로 자동 갱신. 50줄 상한.

## 핵심 원칙
- 관리 포인트 최소화 — 여러 파일/폴더보다 하나로 합침
- 심플 우선, 문제 생기면 개선 — 과도한 추상화/설계 지양
- 편향 방지 > 효율 — 특정 도구/모델에 종속 회피
- 한 곳에서 관리 — 분산된 정보를 통합 선호
- 자동화 지향 — 수동 반복 작업을 시스템으로 대체
- 시스템 설계로 문제 해결 — 개별 fix보다 반복되는 불편을 구조적으로 풀기 선호. 같은 문제가 다시 올 수 있으면 시스템으로 막기

## 근거 패턴
### 관리 포인트 최소화
- archive 폴더 → CHANGELOG 단일 파일 전환 <!-- pattern: 2026-03-08, task: refactor-archive -->
- docs/plans/ + .ai/specs/ → .ai/specs/ 통합 <!-- pattern: 2026-03-08, task: dotfiles-통합 -->
- profile/learnings 역할 분리 — 단일 책임 (겹침 없이) <!-- pattern: 2026-03-09, task: self-learning-improvement -->

### 심플 우선
- log.json → md 전환 (구조화 불필요) <!-- pattern: 2026-03-07, task: session-manager -->
- 세션 요약 단계 불필요 판단 (2단계 필터링으로 충분) <!-- pattern: 2026-03-09, task: self-learning -->
- AI 이해도 기준으로 형식 선택 — 사람 가독성보다 AI 활용 효율 우선 <!-- pattern: 2026-03-09, task: self-learning-improvement -->
- 프로젝트 컨벤션 > AI의 가독성 판단 — is.falsy 등 일관성이 개별 최적화보다 우선 <!-- pattern: 2026-03-11, task: ISH-1326 -->
- 추정보다 실제 확인 — AI 추론 기반 완료 보고 거부, 서버 코드/파일 상태 직접 확인 후 판단 <!-- pattern: 2026-03-12, task: ISH-1267 -->
- 리팩토링 영향도 > 일관성 — 변경 파일이 많아지면 PR 범위에서 제외 선택 <!-- pattern: 2026-03-13, task: ISH-1328 -->

### 자동화 지향
- 자가학습 profile 자동 갱신 선택 (수동 정리 X) <!-- pattern: 2026-03-09, task: self-learning -->
- 사람 개입 없는 자가학습 시스템 지향 — AI가 스스로 판단 패턴을 학습·적용 <!-- pattern: 2026-03-09, task: self-learning-improvement -->

### 한 곳에서 관리
- 세컨드 브레인 컨셉 — 분산된 컨텍스트를 한 시스템에서 적재적소 제공 <!-- pattern: 2026-03-09, task: self-learning-improvement -->
