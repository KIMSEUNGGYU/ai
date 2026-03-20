# fe-workflow 구현 품질 개선

## 문제
스펙 → AI 구현 → 사람 검토 → "이건 아닌데" → 수정 요청 반복. 이 루프가 너무 길다.

## 원인 분석 (세션 데이터 + 심층 분석)

### 수정 요청 분류 (ishopcare-frontend 최근 10세션)
| 원인 | 비율 |
|------|------|
| 패턴 불일치 | ~35% |
| 컨벤션 위반 | ~25% |
| 스펙/입력 무시 | ~15% |
| 기존 코드 미참조 | ~10% |
| 임의 판단 | ~10% |
| 검증 부재 | ~5% |

### 근본 원인
1. **LLM의 한계** — 컨벤션을 읽고도(Read 로그 확인됨) 안 따름
2. **정보 과부하** — 1903줄 컨벤션을 한꺼번에 읽으면 세부 규칙 놓침
3. **자기검증 부실** — 체크리스트가 추상적이라 구체적 위반 못 잡음
4. **자기 편향** — code-writer가 자기 코드를 자기가 검증 → 같은 편향으로 놓침

### 검증 완료 사항
- 컨벤션 문서 품질 → 충분함
- 문서 전달 여부 → Read 되고 있음 (세션 로그 확인)
- **문서를 더 잘 써서 해결할 수 있는 문제가 아님**

## 검증 아키텍처 (확정)

### 2단계 검증 구조
```
[즉시 검증] harness-check.sh (매 Edit/Write)
  → grep 기반 9개 규칙 → 위반 시 즉시 ❌ → AI 자동 수정
  → 비용 0, 1ms

[종합 검증] convention-checker Agent (Phase 완료 후)
  → conventions 전체 기반 → 변경 파일만 체크
  → 위반 시 code-writer에게 수정 지시 → 재체크 (최대 2회 루프)
  → 통과 시 사용자 검토
```

### implement 워크플로우 (목표)
```
Phase N → code-writer Agent (구현)
  ↓
harness (매 Edit/Write 즉시 체크, 기본 실수 방지)
  ↓
Phase N 완료
  ↓
convention-checker Agent (종합 검증, 변경 파일만)
  ↓
위반 0건 → 사용자 검토
위반 N건 → code-writer에게 구체적 수정 지시 → 재체크 (최대 2회)
  ↓
2회 후에도 위반 → 위반 목록과 함께 사용자 검토
```

## 작업 현황

### 완료: 플러그인 구조 개선 (v0.29.0 → v0.32.0)
- [x] architect, perf-optimizer agent 제거
- [x] FE 프로젝트 감지 조건 추가 (UserPromptSubmit + PostToolUse 3개 hook 전부)
- [x] Agent 3개에 references 추가 → conventions Read 호출 제거
- [x] commands 3개에서 conventions 경로 전달 지시 제거
- [x] code-reviewer ACC 섹션 제거 (code-principles.md와 중복)
- [x] 방어적 주석 정리, GUIDE.md 제거, README 최신화
- [x] error-handling 비활성화 (파일 유지, 모든 참조 제거 + 심링크 제거)
- [x] post-edit-convention.sh 제거 (harness-check와 중복)
- [x] harness-check.sh에 cc-monitor 로깅 이관
- [x] convention-checker Agent 스펙 작성 (`.ai/specs/convention-checker-agent.md`)
- [x] 커밋 + push (v0.32.0)

### 완료: convention-checker Agent 구현 (v0.33.0)
- [x] `agents/convention-checker.md` 작성 (스펙 기반)
- [x] `commands/implement.md` 수정 — checker 루프 통합
- [x] 열린 질문 결정:
  - Phase 2B에서도 checker 실행 → Yes (implement에 통합됨)
  - /fe:refactor → 안 넣음 (필요 시 /fe:review)
  - cc-monitor 로깅 → 실전 데이터 쌓인 후 판단
- [ ] 실전 테스트 (회사 PC)

### 보류
- [x] 회사 PC에서 실전 검증 (하네스 + references 개선) → convention-checker 로드/동작 확인 완료
- [ ] Hook 전략 재정립 (checker 구현 후 전체 그림 보고 결정)
- [ ] fe-principles SKILL.md fallback 규칙 정리
- [ ] fe-convention-prompt.sh fallback 요약 정리
- [ ] 스펙 준수 여부 체크 기능 (향후 확장)

## 결정사항
- references vs hooks는 보완 관계 — 메인 대화(Hook) + 서브에이전트(references) 각각 독립 공급
- Hook 요약본은 이전 시도에서 효과 없음 → 전문 주입 유지
- harness 9개 현재 유지 — 즉시 피드백 역할, grep 가능한 건 이미 다 포함
- convention-checker는 새 Agent로 생성 — code-reviewer(리뷰 보고서)와 목적이 다름(수정 지시)
- checker는 Phase 완료 후 1번, 위반 시 최대 2회 루프 → 무한 루프 방지
- error-handling은 현재 비활성 — 나중에 필요 시 references 한 줄 추가로 복원
- post-edit-convention.sh 제거 — harness가 같은 시점에 더 강력하게 동작, cc-monitor 로깅은 harness로 이관

## 논의 과정에서 검증/기각된 것들
| 접근 | 결론 | 이유 |
|------|------|------|
| 패턴 문서 추가 전달 | 기각 | 컨벤션과 대부분 겹침 |
| 컨벤션 요약본 | 기각 | 이전 시도에서 효과 없음 확인 |
| 분리된 AI 리뷰 | → checker Agent | 같은 모델이지만 "다른 Agent"로 편향 회피 |
| 컨벤션별 에이전트 3개 | 기각 | Agent 3번 = 토큰 3배, checker 1개로 충분 |
| 하네스 규칙 확대 | 기각 | grep 가능한 건 이미 다 포함, 나머지는 LLM 필요 |
| 하네스 제거 | 기각 | 즉시 피드백 가치 있음, 비용 0 |
| 전문 주입 제거 | 기각 | 효과 없는 걸 빼는 게 아니라 효과 있게 만드는 게 방향 |

## 기존 완료 작업
- [x] fe-spec 강화 (Gap Analysis)
- [x] implement Phase별 실행
- [x] /done 자가학습 확장
- [x] 커밋 + push (session-manager v0.14.0, fe-workflow v0.24.0)

## 세션 이력
- 584fa32a-4698-42a0-b990-3c160894e809 (2026-03-10 20:30)
- c154b20d-d107-45bd-9bd8-1b2a7798c950 (2026-03-13 22:00)
- 334c208c-df11-4bb2-beef-38cd813dbde3 (2026-03-15 01:30)
- 63339ad0-8b56-4c47-a298-aabd0a82fb9b (2026-03-21 00:30)
