---
title: OpenClaw AI 에이전트 프레임워크 학습
status: backlog
created: 2026-03-06
last-active: 2026-03-08
tags: [learning, openclaw, multi-agent]
---

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

### Phase 5: 세컨브레인 — 자가학습 메모리 아키텍처

> 최종 목표: 3-Layer Memory (A→B→C 점진적 확장)
> - A: 파일 구조 + Git 동기화 (OpenClaw 몰라도 가능)
> - B: 자동 동기화 루프 (Claude Code /done + OpenClaw Heartbeat)
> - C: Cognitive Memory (시맨틱 검색 + 관계 그래프)

#### 5-1. OpenClaw 메모리 심화 학습 (B 구현 전 필수)
- [ ] 메모리 시스템 실전 테스트 — memory_search, memory_get 직접 사용
- [ ] MEMORY.md 승격 패턴 — daily log → 장기 기억 실제 운영
- [ ] Heartbeat 실전 — HEARTBEAT.md 체크리스트 작성 + 동작 확인
- [ ] 외부 파일 참조 — OpenClaw이 brain/ 파일을 읽을 수 있는 방법 탐색
- [ ] 스킬로 brain 동기화 — brain 읽기/쓰기 스킬 설계 검토

#### 5-2. A 구현 — 공유 메모리 파일 구조
- [ ] `dotfiles/brain/` 디렉토리 구조 설계
- [ ] 기존 learnings-*.md → brain/ 이관 or 심링크 설계
- [ ] Claude Code에서 brain/ 파일 자동 로드 설정 (rules 심링크)
- [ ] OpenClaw에서 brain/ 참조 방법 결정
- [ ] Git 동기화 테스트 (push/pull → 양쪽 반영 확인)

#### 5-3. B 구현 — 자동 동기화 루프
- [ ] Claude Code `/done` → brain/ 자동 업데이트 로직
- [ ] OpenClaw Heartbeat/스킬로 brain/ 읽기 연동
- [ ] 양방향 쓰기 (OpenClaw → brain/) 구현
- [ ] 충돌 방지 전략 (동시 수정 시)

#### 5-4. C 구현 — Cognitive Memory (미래)
- [ ] 시맨틱 검색 방안 조사 (Neo4j vs 대안)
- [ ] 관계 그래프 설계
- [ ] 기존 brain/ 데이터 → 그래프 마이그레이션

## 산출물
- `learning/openclaw/notes/` — 학습 노트 5개
  - 01~04: 스킬, 아키텍처, 워크스페이스, 도구 시스템
  - 05-cli-commands.md (CLI 명령어 정리)
- `learning/openclaw/skills/` — 커스텀 스킬 3개
- `~/.openclaw/workspace-brief/` — brief 에이전트 워크스페이스 (SOUL.md, AGENTS.md, daily-brief 스킬)

## 현재 컨텍스트
- Phase 4 거의 완료 (Google Calendar, 멀티모델 미완)
- Phase 5 신규 추가 — 세컨브레인 자가학습 메모리 아키텍처
- 5-1 개념 학습 완료 — OpenClaw 메모리 구조 심화 분석 (memory_search/get, 승격 체계, 20k 제한, 컨텍스트 주입 순서)
- 다음 작업: 5-1 실전 테스트 (memory_search 직접 사용, Heartbeat, 외부 파일 참조) → 5-2 (A 구현)
- 설계 배경: Claude Code learnings + OpenClaw MEMORY.md 통합, 3-Layer Memory 지향
- 참고: LinkedIn 멀티에이전트 협업 글 (3-Layer: Fact+Meta+Runtime), Cognitive Memory 글
- 핵심 인사이트: OpenClaw은 memory/ 폴더만 검색 대상 → brain/ 연동 시 MEMORY.md에 요약 or memory/ 내 심링크 필요

## 결정사항
- 기존 워크스페이스 파일(클로이) 유지, 스킬 라우팅만 AGENTS.md에 추가
- .env 위치: `~/.openclaw/.env` (workspace가 아닌 루트)
- Discord를 메인 채널로 전환 (Telegram은 평소 안 쓰므로)
- 채널 구성: #일반(클로이) / #업무(클로이) / #브리핑(brief 에이전트)
- groupPolicy: open (개인 서버라 allowlist 불필요)
- bindings: #브리핑 채널 ID(1479898639995240578) → brief 에이전트
- 세컨브레인: dotfiles/brain/ 공유 레이어 방식 채택 (Claude Code + OpenClaw 양쪽 참조)
- 점진적 확장: A(파일구조) → B(자동동기화) → C(Cognitive Memory)
- OpenClaw은 우선 읽기만 (A), 쓰기는 B 단계에서 추가
- archive 기능은 현재 /done에서 제거됨 — session ID/active 파일 삭제는 정상 생명주기

## 메모
- Gateway 재시작: `openclaw gateway stop` → `openclaw gateway`
- Discord 봇 토큰은 `channels.discord.token`에 저장
- Discord Message Content Intent 활성화 필수
- gog CLI 설치됨, OAuth 미완료

<!-- last-active: 2026-03-08 14:00 -->

## 세션 이력
- d6b62e5f-f548-4bf9-8c92-617ebc75cb84 (2026-03-08 00:00)
- 10f1ae88-aa19-4fec-8277-ef474d038dd4 (2026-03-08 02:50)
- e1a78f39-58b8-4238-8b41-7ecf1643ffbf (2026-03-08 14:30)
