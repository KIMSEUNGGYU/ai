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
- [x] Codex SDK 기반 멀티 모델 리뷰 에이전트 추가
- [x] NOTES.md 섹션 9: 멀티 모델 오케스트레이션 학습 노트 추가
- [x] 실제 동작 테스트 (Codex CLI 글로벌 설치 + 실행 확인)
- [x] 점수 산출 개선 (LLM 파싱 → CRITICAL/HIGH/MEDIUM 카운트 기반)
- [x] 테스트 스펙 3개 추가 (evals/)
- [x] 단위 테스트 추가 (test/review-eval.test.ts)
- [x] README 테스트 방법 섹션 추가
- [x] NOTES.md 하네스 구분(evals vs evaluators) 설명 추가
- [x] 실행 결과 예시 문서 (evals/results/RUN-EXAMPLES.md)
- [ ] learning/claude-code/ 정리 (삭제 or notes만 보존)

## 현재 컨텍스트
- 브랜치: `feat/multi-model-review` (커밋 2개, 미푸시)
- Codex CLI `0.111.0` 글로벌 설치 완료
- 파이프라인 전체 동작 확인: claude, openai, both 모드 모두 정상
- 점수 산출: `computeScoreFromReview()` — evaluators/review-eval.ts에서 export

## 결정사항
- fe-auto는 학습용 → `learning/`으로 이동 (services/는 실제 서비스 전용)
- Ralph 패턴: 점수 추적 + 메타 분석 + 정체 감지 3요소로 구현
- OpenAI API(`openai` 패키지) 대신 Codex SDK 사용 — ChatGPT 구독으로 동작 가능
- Claude Agent SDK와 Codex SDK는 동일한 아키텍처 (CLI 서브프로세스)
- 점수 산출은 LLM 출력 형식 의존 대신 CRITICAL/HIGH/MEDIUM 카운트 기반 (결정적)
- 테스트 출력은 `evals/output/`에 저장 (.gitignore)
- 단위 테스트는 `test/` 폴더에 배치

## 메모
- 남은 작업: learning/claude-code/ 정리만 남음
- PR 생성 시 이전 커밋(4554937)도 포함
