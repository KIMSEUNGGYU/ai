# FE 구현 품질 자동화 에이전트

## 스펙
- `.ai/specs/fe-agent.md` 참조
- Mastra 워크플로우 + `claude -p` CLI 래퍼 (구독 인증, API 키 불필요)
- 구현자 Sonnet + 리뷰어 Opus + 반박자 Opus
- 객관적 게이트 (tsc, biome, harness) + LLM 리뷰 루프

## 작업
- [x] 문제 정의 — Claude Code 컨텍스트 오염으로 구현 품질 저하
- [x] 아키텍처 설계 — 3개 역할 분리 + 리뷰 루프
- [x] 모델 결정 — Sonnet(구현) + Opus(리뷰/반박)
- [x] 프레임워크 결정 — Mastra (워크플로우 오케스트레이션)
- [x] LLM 호출 방식 결정 — `claude -p` CLI 래퍼 (구독 인증)
- [x] 종료 조건 설계 — 객관적 게이트 + 수렴 감지 + max 3회
- [x] 스펙 파일 저장
- [x] Mastra 프로젝트 셋업 (`services/fe-agent/`)
- [x] Mastra 학습 가이드 (`GUIDE.md`)
- [x] Codex 통합 테스트 (Mastra + codex exec 동작 확인)
- [ ] `claude -p` 래퍼 구현 (`src/mastra/lib/claude.ts`)
- [ ] 워크플로우를 claude CLI 기반으로 전환
- [ ] 리뷰 루프 구현 (dowhile + 수렴 감지)
- [ ] 리뷰어/반박자 병렬 실행 (parallel)
- [ ] 실전 테스트 (2~3건)

## 현재 컨텍스트
Mastra 프로젝트 셋업 완료. 인증 문제 해결됨 — `claude -p` CLI로 구독 계정 사용.
다음: 기존 워크플로우를 claude CLI 기반으로 전환.

## 결정사항
- `claude -p` CLI 래퍼 — API 키 없이 구독 인증으로 LLM 호출. Claude Code의 공식 `-p` 플래그 사용 (정상 사용, 차단 위험 없음)
- Mastra = 오케스트레이션만 — Agent.generate()는 사용 안 함. 워크플로우 엔진 + step 체이닝만 활용
- 모델 선택 — `--model sonnet` / `--model opus`로 CLI에서 직접 지정
- 컨텍스트 격리 — 매 `claude -p` 호출이 독립 프로세스 → 자연스러운 컨텍스트 분리
- Mastra 선택 (SDK 기각) — 워크플로우 오케스트레이션에는 프레임워크가 적합
- 반박자 별도 역할 — 리뷰어(컨벤션 체크)와 분리. 통합하면 반박이 약해짐
- must만 자동 수정 — should/nit/반박자 피드백은 사람 판단용 리포트
- 수렴 감지 — must 수가 증가하면 중단 (코드 악화 방지)

## 인증 탐색 이력
| 시도 | 결과 | 이유 |
|------|------|------|
| Mastra + Anthropic API 키 | 키 없음 | 구독과 API 별도 과금 |
| CLAUDECODE 토큰 → API 키 | 실패 | OAuth 토큰 ≠ API 키 형식 |
| Codex OAuth 토큰 → Mastra | 실패 | 스코프 제한 (api.responses.write 없음) |
| claude-code-mastra 라이브러리 | 기각 | v0.0.1, 모델 선택 불가 |
| `claude -p` CLI 래퍼 | **성공** | 공식 CLI, 구독 인증, 모델 선택 가능 |

## 메모
- fe-workflow conventions/ 5개 문서를 SSOT로 직접 참조 (복사 X)
- 단계적 전환: 수동 실행 → 실전 검증 → /fe:implement 통합 → 대체
- 테스트 파일 정리 필요: test-*.ts 파일들

## 세션 이력
- 673ac7eb-0199-4fab-8c1c-76bc4866866f (2026-03-15 23:30)
