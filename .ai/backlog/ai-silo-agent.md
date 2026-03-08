---
title: AI 사일로 에이전트 시스템 (토스 방식)
status: backlog
created: 2026-03-07
last-active: 2026-03-07
tags: [agent, slack, multi-agent]
---

# AI 사일로 에이전트 시스템 (토스 방식)

## 스펙
- 토스 사일로 조직 구조를 AI 에이전트로 재현
- 각 역할(PO, 디자이너, 개발자, QA)을 독립 에이전트로 구축
- Slack에서 자율적으로 협업하는 멀티 에이전트 시스템

## 레퍼런스
- `.ai/specs/references/agent.md` — 토스 출신 개발자의 AI 사일로 사례
- 핵심: 개별 Slack Bot App + LLM API로 각 역할 에이전트 구현

## 학습/구현 계획

### Phase 1: 리서치
- [ ] 토스 사일로 구조 상세 분석 (PO/디자이너/개발자/QA 역할 정의)
- [ ] 구현 방식 비교: 직접 구축 vs OpenClaw vs Claude Agent SDK
- [ ] Slack Bot App 생성 + LLM 연동 기본 구조 파악

### Phase 2: 단일 에이전트 PoC
- [ ] Slack Bot 1개 생성 (역할: PO or 개발자)
- [ ] Claude API 연동 + 채널 메시지 읽기/쓰기
- [ ] 시스템 프롬프트로 역할 부여 + 행동 규칙 정의

### Phase 3: 멀티 에이전트 협업
- [ ] 2개 이상 에이전트 간 Slack 채널 내 대화
- [ ] 작업 핸드오프 (PO -> 개발자 -> QA)
- [ ] 에스컬레이션 로직 (블로커 발생 시 사람에게 알림)

### Phase 4: 실전 워크플로우
- [ ] 스펙 정의 -> 구현 -> 리뷰 -> 배포 파이프라인
- [ ] Git PR 생성/리뷰 자동화
- [ ] 사람 개입 최소화 (머지 승인만)

## OpenClaw 학습과의 연결
- OpenClaw Phase 4 (멀티 에이전트 라우팅)와 직접 연결
- OpenClaw로 구현 시: 스킬 = 역할, 채널 = 사일로
- 두 접근법 비교 후 최적 방식 선택 가능

## 현재 컨텍스트
- 브랜치: 미정
- 상태: 리서치 단계

## 결정사항
- (아직 없음)

## 메모
- 직접 구축 방식: 완전한 제어권, 인프라 직접 관리 필요
- OpenClaw 방식: 스킬/채널 라우팅 내장, 프레임워크 제약 있음
- Claude Agent SDK 방식: SDK 도구 활용 가능, 멀티봇 구조는 직접 설계
