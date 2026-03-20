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
- 패턴 문서 품질 → 충분함 (컨벤션과 대부분 겹침, 추가 전달 불필요)
- 문서 전달 여부 → Read 되고 있음 (세션 로그 확인)
- **문서를 더 잘 써서 해결할 수 있는 문제가 아님**

## 검증 아키텍처 (확정)

### 2단계 검증 구조
```
[즉시 검증] harness-check.sh (매 Edit/Write)
  → grep 기반 9개 규칙 → 위반 시 즉시 ❌ → AI 자동 수정
  → 비용 0, 1ms

[종합 검증] convention-checker Agent (Phase 완료 후)
  → conventions 전체(50개+) 기반 → 변경 파일만 체크
  → 위반 시 code-writer에게 수정 지시 → 재체크 (최대 2회 루프)
  → 통과 시 사용자 검토
```

### 왜 2단계인가
- harness: grep 가능한 기본 실수(enum, any, console.log)를 즉시 잡음 → 누적 방지
- checker Agent: grep 불가능한 규칙(SSOT, SRP, 추상화, A-B-A-B, 응집도 등) → LLM 판단 필요
- harness 9개로는 conventions 50개+ 중 일부만 커버 → checker Agent가 나머지 담당

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

### 완료: 플러그인 구조 개선 (v0.29.0 → v0.31.0)
- [x] architect agent 제거
- [x] perf-optimizer agent 제거
- [x] UserPromptSubmit hook에 FE 프로젝트 감지 조건 추가
- [x] PostToolUse hooks에 FE 프로젝트 감지 조건 추가
- [x] Agent 3개에 references 추가 → conventions Read 호출 제거
- [x] commands 3개에서 conventions 경로 전달 지시 제거
- [x] code-reviewer ACC 섹션 제거 (code-principles.md와 중복)
- [x] 방어적 주석 정리, GUIDE.md 제거, README 최신화

### 다음: convention-checker Agent 구현
- [ ] convention-checker Agent 스펙 작성
  - references: conventions 5개
  - 입력: 변경된 파일 목록
  - 출력: 위반 목록 + 구체적 수정 지시 (code-writer가 읽는 용)
  - code-reviewer와 다름: 점수/피드백이 아닌 수정 지시 형태
- [ ] implement command에 checker 루프 통합
- [ ] post-edit-convention.sh 처리 결정 (checker 구현 후 판단)
- [ ] fe-principles SKILL.md fallback 규칙 정리
- [ ] fe-convention-prompt.sh fallback 요약 정리

### 보류
- [ ] 회사 PC에서 실전 검증 (하네스 + references 개선)
- [ ] Hook 전략 재정립 (checker 구현 후 전체 그림 보고 결정)

## 결정사항
- references vs hooks는 보완 관계 — 메인 대화(Hook) + 서브에이전트(references) 각각 독립 공급
- Hook 요약본은 이전 시도에서 효과 없음 → 전문 주입 유지
- harness 9개 현재 유지 — 즉시 피드백 역할, grep 가능한 건 이미 다 포함
- convention-checker는 새 Agent로 생성 — code-reviewer(리뷰 보고서)와 목적이 다름(수정 지시)
- checker는 Phase 완료 후 1번, 위반 시 최대 2회 루프 → 무한 루프 방지

## 논의 과정에서 검증/기각된 것들
| 접근 | 결론 | 이유 |
|------|------|------|
| 패턴 문서 추가 전달 | 기각 | 컨벤션과 대부분 겹침 |
| 컨벤션 요약본 | 기각 | 이전 시도에서 효과 없음 확인 |
| 분리된 AI 리뷰 | → checker Agent | 같은 모델이지만 "다른 Agent"로 편향 회피 |
| 컨벤션별 에이전트 3개 | 기각 | Agent 3번 = 토큰 3배, checker 1개로 충분 |
| 하네스 규칙 확대 | 기각 | grep 가능한 건 이미 다 포함, 나머지는 LLM 필요 |
| 하네스 제거 | 기각 | 즉시 피드백 가치 있음, 비용 0 |
| Mastra/SDK | 불필요 | 코딩 에이전트는 Claude Code |
| 전문 주입 제거 | 기각 | 효과 없는 걸 빼는 게 아니라 효과 있게 만드는 게 방향 |

## 기존 완료 작업
- [x] fe-spec 강화 (Gap Analysis)
- [x] implement Phase별 실행
- [x] /done 자가학습 확장
- [x] 커밋 + push (session-manager v0.14.0, fe-workflow v0.24.0)

## 관련 자료
- Mastra 비교: `~/hq/00_Inbox/mastra-vs-sdk-에이전트-프레임워크-비교.md`
- Ralph (에이전트 루프): https://github.com/snarktank/ralph

## 세션 이력
- 584fa32a-4698-42a0-b990-3c160894e809 (2026-03-10 20:30)
- c154b20d-d107-45bd-9bd8-1b2a7798c950 (2026-03-13 22:00)
- 334c208c-df11-4bb2-beef-38cd813dbde3 (2026-03-15 01:30)
- 63339ad0-8b56-4c47-a298-aabd0a82fb9b (2026-03-20 23:30)
