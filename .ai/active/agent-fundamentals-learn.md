# Agent Fundamentals 학습 + 정리

## 스펙
- fe-auto 프로젝트를 분석하여 AI 에이전트 핵심 패턴 학습
- 오케스트레이션, Ralph(자기참조 루프), 하네스(eval), 멀티 모델 오케스트레이션

## 작업
- [x] fe-auto 프로젝트 구조 파악
- [x] 오케스트레이션 / Ralph / 하네스 개념 학습
- [x] Ralph 패턴 구현 (PR #11 → merged)
- [x] 개념 정리 학습 노트 작성 (NOTES.md)
- [x] fe-auto → learning/agent-fundamentals/ 이동 (PR #12 → merged)
- [x] README.md + NOTES.md 분리
- [x] Codex SDK 기반 멀티 모델 리뷰 에이전트 추가 (커밋 완료)
- [x] NOTES.md 섹션 9: 멀티 모델 오케스트레이션 학습 노트 추가
- [ ] 실제 동작 테스트 (Codex CLI 글로벌 설치 + 실행 확인)
- [ ] learning/claude-code/ 정리 (삭제 or notes만 보존)

## 현재 컨텍스트
- 브랜치: `feat/multi-model-review` (커밋 완료, 미푸시)
- 태그: `v0.2.0-agent-fundamentals` (이번 작업 전 상태)
- `review-agent-openai.ts`: Codex SDK로 구현 완료, 타입 체크 통과
- `main.ts`: `--reviewer claude|openai|both` 플래그 추가
- Codex CLI는 npx로 동작하나 글로벌 미설치 → SDK 런타임 테스트 필요

## 결정사항
- fe-auto는 학습용 → `learning/`으로 이동 (services/는 실제 서비스 전용)
- Ralph 패턴: 점수 추적 + 메타 분석 + 정체 감지 3요소로 구현
- OpenAI API(`openai` 패키지) 대신 Codex SDK 사용 — ChatGPT 구독으로 동작 가능
- Claude Agent SDK와 Codex SDK는 동일한 아키텍처 (CLI 서브프로세스)

## 메모
- 다음 세션: Codex CLI 글로벌 설치 후 실제 실행 테스트
- learning/claude-code/는 삭제 방향 (notes/만 보존 여부 결정 필요)
