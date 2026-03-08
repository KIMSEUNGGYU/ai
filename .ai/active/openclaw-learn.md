# OpenClaw AI 에이전트 프레임워크 학습

## 스펙
- OpenClaw 프레임워크로 실전 에이전트 구축
- 설치 → 스킬 시스템 이해 → 커스텀 에이전트 구축

## 작업

### Phase 1: 설치 + 기본 동작 이해 (완료)
- [x] OpenClaw 설치 + Gateway 실행
- [x] Telegram 채널 연결
- [x] LLM 연결 (Claude) + 기본 대화 확인

### Phase 1.5: 아키텍처 + 스킬 시스템 학습 (완료)
- [x] 아키텍처 이해 (Gateway → Bindings → Agent)
- [x] 스킬 구조 해부 (weather, summarize, gh-issues, skill-creator)
- [x] 워크스페이스 파일 이해 (SOUL.md, AGENTS.md, USER.md 등)
- [x] 도구 시스템 이해 (내장 도구 vs 스킬)
- [x] 메모리 시스템 이해 (마크다운 + 벡터 검색)
- [x] 멀티 에이전트 라우팅 이해

### Phase 2: 커스텀 스킬 작성 (완료)
- [x] my-weather 스킬 (단순 도구형)
- [x] linear-issues 스킬 (도구 연동형)
- [x] daily-brief 스킬 (워크플로우 오케스트레이션형)
- [x] 워크스페이스 파일 초안 (SOUL.md, AGENTS.md, USER.md, IDENTITY.md)

### Phase 3: 실전 테스트 (거의 완료)
- [x] 워크스페이스 파일 배치 (~/.openclaw/workspace/)
- [x] 스킬 파일 배치 (~/.openclaw/workspace/skills/)
- [x] Telegram에서 각 스킬 테스트 (3개 모두 동작 확인)
- [x] cron으로 daily-brief 자동 실행 설정 (매일 6시 KST)
- [x] daily-brief 스킬에 GitHub PR 리뷰 섹션 추가
- [ ] 피드백 기반 스킬 개선 (내일 브리핑 후)

### Phase 4: 고급 기능 (진행중)
- [x] Discord 채널 연결 + 테스트
- [x] Discord 채널 분리 (#일반, #업무, #브리핑)
- [x] 멀티 에이전트 설정 — brief 에이전트 생성 + #브리핑 라우팅
- [x] cron 브리핑 대상 Discord #브리핑으로 변경
- [x] #브리핑 채널 테스트 (brief 에이전트 동작 확인)
- [ ] Google Calendar 연동 (gog CLI OAuth 인증 필요)
- [ ] 멀티 모델 (Sonnet 일상, Opus 심화)

## 산출물
- `learning/openclaw/notes/` — 학습 노트 5개
  - 01~04: 스킬, 아키텍처, 워크스페이스, 도구 시스템
  - 05-cli-commands.md (CLI 명령어 정리)
- `learning/openclaw/skills/` — 커스텀 스킬 3개
- `~/.openclaw/workspace-brief/` — brief 에이전트 워크스페이스 (SOUL.md, AGENTS.md, daily-brief 스킬)

## 현재 컨텍스트
- Discord 연결 완료, 3채널 구성 (#일반, #업무, #브리핑)
- 에이전트 2개: main(클로이) + brief(브리핑봇)
- #브리핑 → brief 에이전트 라우팅 설정 완료
- cron daily-brief → Discord #브리핑 + brief 에이전트로 변경됨
- 다음: #브리핑 채널에서 테스트

## 결정사항
- 기존 워크스페이스 파일(클로이) 유지, 스킬 라우팅만 AGENTS.md에 추가
- .env 위치: `~/.openclaw/.env` (workspace가 아닌 루트)
- Discord를 메인 채널로 전환 (Telegram은 평소 안 쓰므로)
- 채널 구성: #일반(클로이) / #업무(클로이) / #브리핑(brief 에이전트)
- groupPolicy: open (개인 서버라 allowlist 불필요)
- bindings: #브리핑 채널 ID(1479898639995240578) → brief 에이전트

## 메모
- Gateway 재시작: `openclaw gateway stop` → `openclaw gateway`
- Discord 봇 토큰은 `channels.discord.token`에 저장
- Discord Message Content Intent 활성화 필수
- gog CLI 설치됨, OAuth 미완료

<!-- last-active: 2026-03-08 -->

## 세션 이력
- d6b62e5f-f548-4bf9-8c92-617ebc75cb84 (2026-03-08 00:00)
- 10f1ae88-aa19-4fec-8277-ef474d038dd4 (2026-03-08 02:50)
