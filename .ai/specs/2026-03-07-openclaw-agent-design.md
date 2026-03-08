# OpenClaw 에이전트 학습 + 구축 설계

> 날짜: 2026-03-07
> 상태: 승인됨

## 목표
OpenClaw 스킬 시스템을 이해하고, 업무 자동화 에이전트를 구축한다.

## 현재 상태
- OpenClaw 설치 완료 (다른 PC)
- Telegram 연결 + 기본 대화 동작
- LLM(Claude) 연결 완료

## 접근 방식: 해부 → 클론 → 확장

### Phase 1: 스킬 구조 해부 (이 PC에서)
1. 커뮤니티 스킬 2-3개 SKILL.md 분석
   - YAML 프론트매터 필드 (name, description, triggers 등)
   - 마크다운 본문 패턴 (Rules, Steps, Output format)
   - 도구 연동 방식 (MCP, API 호출)
2. 스킬 분류 체계 정리 (단순 지시형 / 도구 연동형 / 워크플로우형)
3. 학습 노트 정리

### Phase 2: 첫 스킬 만들기 (OpenClaw PC에서)
1. 커뮤니티 스킬 클론 → 수정 → 동작 확인
2. 나만의 간단한 스킬 1개 작성
3. Telegram에서 실제 테스트

### Phase 3: 업무 자동화 스킬 (OpenClaw PC에서)
1. Linear 이슈 조회/생성 스킬
2. GitHub PR 알림 스킬
3. 멀티 스킬 오케스트레이션

## 산출물
- `learning/openclaw/notes/` — 학습 노트
- `learning/openclaw/skills/` — 직접 만든 스킬 파일들
- `.ai/active/openclaw-learn.md` 업데이트

## 채널
- Telegram (현재 연결됨, 변경 가능)

## 제약
- OpenClaw는 다른 PC에 설치 → 여기서는 리서치/작성, 테스트는 다른 PC
- 스킬 파일은 Git 레포로 관리하여 전송
