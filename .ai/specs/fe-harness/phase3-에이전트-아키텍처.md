# Phase 3: AI 에이전트 아키텍처

> Phase 2 이후 진행

## 목표
구현 품질 자동화 시스템 설계 — 에이전트 패턴 적용.

## 논의된 개념들
| 개념 | 출처 | 설명 |
|------|------|------|
| 오케스트레이션 | 일반 | 여러 에이전트 조율 (implement가 이미 하고 있음) |
| 하네스 (피드백 루프) | Ralph | tsc/lint/build 등 기계적 검증을 게이트로 사용 |
| Ralph 루프 | snarktank/ralph | 깨끗한 컨텍스트로 반복 실행 + AGENTS.md 학습 축적 |
| Devil's Advocate | 브레인스토밍 | 항상 반박하는 에이전트 (code-reviewer 강화) |
| 멀티모델 리뷰 | 브레인스토밍 | Claude 구현 + Codex 리뷰 (비용/복잡도 높음) |

## 참고
- Ralph: https://github.com/snarktank/ralph
- 핵심 철학: "Ralph only works if there are feedback loops"
- 하네스 도구: tsc --noEmit, biome format (이미 프로젝트에 있음)

## 의존성
- Phase 1-2에서 프롬프트/문서 기반 개선 한계가 확인되어야 의미 있음
