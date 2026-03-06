# 실행 결과 예시

> 실제 파이프라인 실행 로그를 기록하여 동작 흐름을 이해하기 위한 문서.

---

## 예시 1: 유틸 함수 (1사이클 통과, --reviewer both)

**입력**: `spec-date-utils.md` (formatRelativeDate 함수)
**리뷰어**: both (Claude + OpenAI 병렬)

```
══════════════════════════════════════════════════
fe-auto 시작
스펙: ./evals/spec-date-utils.md
프로젝트: ./evals/output
══════════════════════════════════════════════════

[Pipeline] Code → Review 루프 (Ralph)

--- Cycle 1/5 ---
[전략] 스펙 기반 초기 구현

[Code Agent] 코드 생성 시작
  스펙 기반 코드 생성 중...
    도구: Bash, Glob, Read, Edit, Bash...
    턴: 17 | 비용: $0.5075

  코드 평가: 빌드=true 타입=true 파일=true 컨벤션=true
  코드 생성 완료!

[Both] Claude + OpenAI 리뷰 병렬 실행

──────────────────────────────────────────────────
[비교] Claude vs OpenAI 리뷰 결과
──────────────────────────────────────────────────
Claude 리뷰: 리뷰 통과. 이슈 없음.
OpenAI 리뷰: MEDIUM 1개 (테스트 추가 제안)
비용: Claude $0.1718 | OpenAI $0.0000
──────────────────────────────────────────────────

[점수] 95/100 (히스토리: 95)         ← MEDIUM 1개 = -5점
[Ralph] 검증 통과!                   ← 90점 이상이므로 1사이클 만에 통과

══════════════════════════════════════════════════
결과 요약
스펙: ./evals/spec-date-utils.md
총 비용: $0.6793
리뷰: 통과
══════════════════════════════════════════════════
```

### 흐름 해석

```
Code Agent (17턴, $0.51)
  ├─ 프로젝트 구조 확인 (Glob, Bash)
  ├─ 기존 패턴 파악 (Read)
  ├─ 파일 생성 (Write, Edit)
  └─ 빌드 확인 (Bash: tsc --noEmit)

Code Evaluator (하네스 레벨 1)
  └─ 빌드/타입/파일/컨벤션 4개 체크 → 모두 통과

Review Agent × 2 (병렬)
  ├─ Claude: 이슈 없음 → 통과
  └─ OpenAI: MEDIUM 1개 (경계 케이스 테스트 제안)

Review Evaluator + 점수 산출
  └─ CRITICAL=0, HIGH=0, MEDIUM=1 → 95/100

Ralph 판정
  └─ 95 ≥ 90 → 통과, 루프 종료
```

---

## 예시 2: React 컴포넌트 (2사이클, Ralph 전략 전환)

**입력**: `spec-status-badge.md` (StatusBadge 컴포넌트)
**리뷰어**: openai

```
══════════════════════════════════════════════════
fe-auto 시작
스펙: ./evals/spec-status-badge.md
프로젝트: ./evals/output
══════════════════════════════════════════════════

[Pipeline] Code → Review 루프 (Ralph)

--- Cycle 1/5 ---
[전략] 스펙 기반 초기 구현

[Code Agent] 코드 생성 시작
  턴: 28 | 비용: $0.4665
  코드 평가: 빌드=true 타입=true 파일=true 컨벤션=true

[Review Agent (Codex)] 코드 리뷰 시작
  Codex 기반 리뷰 중...
  리뷰 평가: CRITICAL=0 HIGH=2 MEDIUM=0
  → 재리뷰 (1/2)... 리뷰 평가: CRITICAL=0 HIGH=2 MEDIUM=0
  → 재리뷰 (2/2)... 리뷰 평가: CRITICAL=0 HIGH=2 MEDIUM=0
  최대 재시도 도달.

[점수] 70/100 (히스토리: 70)         ← HIGH 2개 = -30점
Cycle 1 리뷰 미통과. 전략 전환 → 재시도...

--- Cycle 2/5 ---
[전략] 전략 전환: 리뷰 실패 원인 기반 재설계

[Code Agent] 코드 생성 시작
  턴: 21 | 비용: $0.2436
  코드 평가: 빌드=true 타입=true 파일=true 컨벤션=true

[Review Agent (Codex)] 코드 리뷰 시작
  리뷰 평가: CRITICAL=0 HIGH=0 MEDIUM=0
  리뷰 통과!

[점수] 100/100 (히스토리: 70 → 100)  ← 이슈 0개
[Ralph] 검증 통과!

══════════════════════════════════════════════════
결과 요약
스펙: ./evals/spec-status-badge.md
총 비용: $0.7100
리뷰: 통과
══════════════════════════════════════════════════
```

### 흐름 해석

```
Cycle 1: 첫 시도
  Code Agent → 28턴으로 코드 생성 (React + Tailwind 설정 포함)
  Review Agent → HIGH 2개 발견
    └─ 에이전트 내부 재리뷰 3회 시도 → 계속 HIGH 2개 (코드를 수정 못 하므로)
  점수: 70/100 → 90 미만 → 미통과

  Ralph 메타 분석:
    "70점, 첫 시도, 전략 전환 필요"
    → Code Agent에 메타 분석 + 리뷰 피드백 + 전략 지시 전달

Cycle 2: 전략 전환 후 재시도
  Code Agent → 메타 분석을 보고 HIGH 이슈 2개를 수정
  Review Agent → 이슈 0개
  점수: 100/100 → 통과!
```

### 핵심 관찰

1. **Review Agent 내부 재시도는 한계가 있다**
   - Review Agent는 코드를 읽기만 하고 수정하지 않음
   - 같은 코드를 3번 리뷰해도 같은 이슈가 나옴
   - 실제 수정은 Code Agent만 할 수 있음

2. **Ralph의 가치**
   - Cycle 1의 리뷰 피드백만 전달하면 "단순 루프"
   - Ralph는 메타 분석(점수 추이 + 전략 평가 + 전략 지시)을 붙여서 전달
   - Code Agent가 "왜 실패했는지, 어떻게 접근해야 하는지"를 알 수 있음

3. **비용 구조**
   - Cycle 1: Code($0.47) + Review(Codex, 구독) = $0.47
   - Cycle 2: Code($0.24) + Review(Codex, 구독) = $0.24
   - 총: $0.71 (2사이클)
   - Codex(OpenAI) 리뷰는 구독 기반이라 추가 비용 없음

---

## 예시 3: 유틸 함수 (3사이클, 정체 감지)

**입력**: `test-spec.md` (formatPrice 함수)
**리뷰어**: openai
**점수 산출 이전** (정규식 파싱 시절 — 점수 0 문제 있었던 시기)

```
--- Cycle 1/5 ---
[점수] 0/100 (히스토리: 0)          ← 리뷰 출력에 "XX/100" 형식 없어서 파싱 실패

--- Cycle 2/5 ---
[점수] 0/100 (히스토리: 0 → 0)
[Ralph] 정체 감지!                  ← 2회 연속 같은 점수 → 전략 근본 전환

--- Cycle 3/5 ---
[점수] 0/100 (히스토리: 0 → 0 → 0)
[Ralph] 검증 통과!                  ← "이슈 없음" 텍스트 매칭으로 통과
```

### 이 문제를 해결한 개선

```
Before: LLM 출력에서 "XX/100" 정규식 파싱 → 형식 안 맞으면 항상 0점
After:  CRITICAL/HIGH/MEDIUM 카운트 기반 결정적 점수 산출
        → computeScoreFromReview() in evaluators/review-eval.ts
```

개선 후 같은 테스트:
```
--- Cycle 1/5 ---
[점수] 80/100 (히스토리: 80)        ← HIGH 1개 + MEDIUM 1개 = -20점

--- Cycle 2/5 ---
[점수] 100/100 (히스토리: 80 → 100)
[Ralph] 검증 통과!
```

점수가 실제 이슈 수를 반영하므로 Ralph의 전략 판단이 의미있게 동작한다.
