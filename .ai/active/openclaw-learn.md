# OpenClaw AI 에이전트 프레임워크 학습

## 스펙
- OpenClaw 프레임워크로 실전 에이전트 구축
- 설치 → 스킬 시스템 이해 → 커스텀 에이전트 구축

## 학습 계획

### Phase 1: 설치 + 기본 동작 이해 (완료)
- [x] OpenClaw 설치 + Gateway 실행 (다른 PC)
- [x] Telegram 채널 연결
- [x] LLM 연결 (Claude) + 기본 대화 확인

### Phase 1.5: 아키텍처 + 스킬 시스템 학습 (완료)
- [x] 아키텍처 이해 (Gateway → Bindings → Agent)
- [x] 스킬 구조 해부 (weather, summarize, gh-issues, skill-creator)
- [x] 워크스페이스 파일 이해 (SOUL.md, AGENTS.md, USER.md 등)
- [x] 도구 시스템 이해 (내장 도구 vs 스킬)
- [x] 메모리 시스템 이해 (마크다운 + 벡터 검색)
- [x] 멀티 에이전트 라우팅 이해

### Phase 2: 커스텀 스킬 작성 (완료 — 초안)
- [x] my-weather 스킬 (단순 도구형)
- [x] linear-issues 스킬 (도구 연동형)
- [x] daily-brief 스킬 (워크플로우 오케스트레이션형)
- [x] 워크스페이스 파일 초안 (SOUL.md, AGENTS.md, USER.md, IDENTITY.md)

### Phase 3: 실전 테스트 (다음 — 다른 PC에서)
- [ ] 워크스페이스 파일 배치 (~/.openclaw/workspace/)
- [ ] 스킬 파일 배치 (~/.openclaw/workspace/skills/)
- [ ] Telegram에서 각 스킬 테스트
- [ ] cron으로 daily-brief 자동 실행 설정
- [ ] 피드백 기반 스킬 개선

### Phase 4: 고급 기능
- [ ] 멀티 에이전트 설정 (채널별 분리)
- [ ] GitHub PR 알림 스킬
- [ ] 멀티 모델 (Sonnet 일상, Opus 심화)

## 산출물
- `learning/openclaw/notes/` — 학습 노트 4개
  - 01-skill-anatomy.md (스킬 구조)
  - 02-architecture.md (전체 아키텍처)
  - 03-workspace-files.md (워크스페이스 파일)
  - 04-tools-system.md (도구 시스템)
- `learning/openclaw/skills/` — 커스텀 스킬 3개
  - my-weather/ (날씨 조회)
  - linear-issues/ (Linear 이슈)
  - daily-brief/ (데일리 브리핑)
- `learning/openclaw/workspace/` — 워크스페이스 파일 초안
- `docs/plans/2026-03-07-openclaw-agent-design.md` — 설계 문서

## 결정사항
- Telegram 채널 유지 (변경 가능)
- 스킬 파일은 Git 레포로 관리
- 접근법: 해부 → 클론 → 확장
- OpenClaw는 다른 PC에 설치 — 여기서 리서치/작성, 테스트는 다른 PC

## 메모
- description이 스킬 트리거의 핵심 — "when to use" 정보를 여기에
- 에이전트는 이미 똑똑함 → 모를 정보만 스킬에 넣기
- SOUL.md = 성격, AGENTS.md = 행동 규칙 (역할 분리)
- 워크스페이스 파일은 매 턴 주입 → 짧게 유지

<!-- last-active: 2026-03-07 -->
