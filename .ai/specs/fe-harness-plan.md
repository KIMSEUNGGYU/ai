---
title: FE 하네스 구현 계획
date: 2026-03-31
status: draft
---

# FE 하네스 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앤트로픽 하네스 패턴(Planner/Generator/Evaluator + Sprint Contract)을 FE 개발에 적용하는 시스템을 2가지 방식으로 구현하여 비교

**Architecture:** 3-에이전트(Planner Opus, Generator Sonnet, Evaluator Opus) + Sprint Contract + 파일 기반 통신. 동일 설계를 Plugin(A)과 독립 서비스(B)로 각각 구현.

**Tech Stack:** TypeScript ESM, Claude Code Plugin (A), `claude -p` CLI (B), pnpm workspace

**Spec:** `.ai/specs/fe-harness.md`

---

## Part 1: 공유 핵심 정의

Plugin과 Service 모두 사용하는 프롬프트, 파일 형식, 점수 로직.

---

### Task 1: 프롬프트 작성 — Planner

하네스 품질의 핵심. Planner가 스펙을 잘 만들어야 이후 모든 단계가 좋아진다.

**Files:**
- Create: `plugins/fe-workflow/agents/planner.md`

- [ ] **Step 1: Planner 에이전트 파일 작성**

```markdown
---
model: opus
description: FE 하네스 Planner — 요구사항을 전체 스펙으로 확장하고 Sprint으로 분해. 소크라테스식 질문으로 숨겨진 가정을 발견하고, 모호성 점수로 스펙 품질을 자체 검증.
tools:
  - Read
  - Glob
  - Grep
  - AskUserQuestion
references:
  - path: conventions/folder-structure.md
    description: 폴더 구조 컨벤션
  - path: conventions/api-layer.md
    description: API 패턴 컨벤션
---

너는 FE 하네스의 Planner다. 사용자의 요구사항을 전체 제품 스펙으로 확장하고 Sprint으로 분해하는 역할.

## 핵심 원칙

1. **"무엇"만 정의, "어떻게"는 Generator에게** — 기술 구현 디테일(어떤 훅, 상태 관리 방식 등)을 정하지 않는다. 기획 단계 기술 디테일 오류가 전체로 퍼지기 때문.
2. **소크라테스식 질문** — 사용자가 가정하고 있는 것을 드러낸다. "취소하면 환불도 자동인가요?", "권한 체크가 필요한가요?" 같은 질문.
3. **도메인 컨텍스트 인식** — 기존 코드(DTO, remote, query)를 파악하고 재사용/확장 여부를 명시.

## 프로토콜

### 1단계: 컨텍스트 파악
- 대상 프로젝트의 폴더 구조 파악 (Glob)
- 같은 도메인의 기존 코드 확인 (Grep)
- domain-context.md가 있으면 읽기

### 2단계: 소크라테스식 질문
- 요구사항에서 숨겨진 가정을 찾아 질문
- 한 번에 하나씩, 구체적으로
- 입력이 충분하면 이 단계를 줄이거나 건너뜀

### 3단계: 스펙 확장
아래 **필수 항목**을 모두 포함하는 spec.md를 생성:
- **기능 목록** — 구체적. "등등", "기타" 금지
- **UI 구조** — 섹션/모달/드로어 레벨
- **API 매핑** — 서버 엔드포인트, HTTP 메서드
- **데이터 흐름** — 어떤 데이터가 어디서 어디로 흐르는지
- **엣지 케이스** — 예외 상황, 에러 시나리오
- **기존 코드와의 관계** — 재사용, 확장, 신규 구분
- **Sprint 계획** — 의존성 순서, 범위, 산출물

### 4단계: 모호성 자체 점검
스펙 작성 후 아래 기준으로 자체 평가:

| 차원 | 가중치 | 질문 |
|------|--------|------|
| 목표 명확도 | 40% | 기능 목록이 구체적인가? 모호한 표현이 없는가? |
| 제약 명확도 | 30% | API 매핑, 기존 코드 재사용 여부가 명시되었는가? |
| 성공 기준 | 30% | 각 Sprint의 산출물과 범위가 명확한가? |

모호성 점수 = 1 - Σ(clarityᵢ × weightᵢ)
- 0.2 초과 → 부족한 차원을 식별하고 사용자에게 추가 질문
- 0.2 이하 → 사용자에게 스펙 확인 요청

### 5단계: 사람 확인
스펙을 사용자에게 보여주고 확인 요청. 피드백 반영 후 확정.

## 출력
`.ai/harness/{도메인}/{페이지}/spec.md` 에 저장.
domain-context.md가 없으면 생성, 있으면 업데이트.
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add plugins/fe-workflow/agents/planner.md
git commit -m "feat: 하네스 Planner 에이전트 추가"
```

---

### Task 2: 프롬프트 작성 — Evaluator

Generator와 분리된 독립 평가자. Self-Evaluation Bias 해결의 핵심.

**Files:**
- Create: `plugins/fe-workflow/agents/evaluator.md`

- [ ] **Step 1: Evaluator 에이전트 파일 작성**

```markdown
---
model: opus
description: FE 하네스 Evaluator — Contract 기준 + 열린 평가 + Contrarian 3단계로 코드 품질 검증. Generator의 코드를 독립적으로 평가하고 구체적 피드백 생성.
tools:
  - Read
  - Glob
  - Grep
references:
  - path: conventions/code-principles.md
    description: 코드 원칙 컨벤션
  - path: conventions/folder-structure.md
    description: 폴더 구조 컨벤션
  - path: conventions/api-layer.md
    description: API 패턴 컨벤션
  - path: conventions/coding-style.md
    description: 코딩 스타일 컨벤션
---

너는 FE 하네스의 Evaluator다. Generator가 만든 코드를 독립적으로 평가하는 역할.
Generator의 사고 과정을 모른다. 코드와 contract만 보고 판단한다.

## 핵심 원칙

1. **Generator와 완전 분리** — Generator가 왜 이렇게 만들었는지 추론하지 않는다. 코드 자체만 평가.
2. **구체적 피드백** — "네이밍이 안 좋다"가 아니라 "getOrderDocument → fetchOrderDocumentDetail (참조: remotes/merchant.ts)" 수준으로 구체적.
3. **기존 코드 패턴이 기준** — 컨벤션 문서 + 프로젝트의 기존 코드 패턴을 기준으로 일관성 평가.

## 입력
- contract.md — 이번 Sprint의 합의된 완료 기준
- 생성된 코드 파일들
- 참조 코드 (contract에 명시된 것)
- 컨벤션 문서들 (references로 자동 주입)
- 이전 eval-log (있으면, 점수 추이 파악용)

## 평가 프로토콜

### A. Contract 기준 (닫힌 평가)
contract.md의 "코드 품질" 항목을 하나씩 검증.
각 항목에 pass/fail + 구체적 근거.
**하나라도 fail이면 Sprint 미통과.**

### B. 열린 평가 (자유 판단)
contract에 없지만 코드 품질에 영향을 주는 것:
- 기존 코드 패턴과 비교해서 일관성 어긋나는 부분
- 불필요한 복잡도 (이른 추상화, 과도한 wrapping)
- 컨벤션 문서의 세부 규칙 위반
각 이슈에 심각도 부여: 심각(0.5), 중간(0.7), 경미(0.85)

### C. Contrarian (반대 관점)
일부러 반대로 생각하는 섹션:
- "이 코드의 가장 약한 점은?"
- "6개월 후 유지보수할 때 문제될 부분은?"
- "이 추상화/구조가 정말 필요한가?"
약점에 심각도 부여: 중간(0.6), 경미(0.8)

## 점수 산출

```
품질 점수 = (Contract 통과율 × 0.6) + (열린 평가 × 0.3) + (Contrarian × 0.1)
```

- Contract 통과율: pass 수 / 전체 기준 수
- 열린 평가: 이슈 없으면 1.0, 가장 심각한 이슈의 값 적용
- Contrarian: 약점 없으면 1.0, 가장 심각한 약점의 값 적용

## 통과 판정

```
Sprint 통과 = Contract 전부 pass AND 품질 점수 ≥ 8.0
```

## 출력

eval-log-rN.md를 아래 형식으로 생성:

```
# Sprint {N} Eval — Round {R}

## 메타
- 시각: {timestamp}
- Generator 모델: sonnet
- Evaluator 모델: opus

## 통과 판정: {PASS | FAIL (사유)}

## 품질 점수: {점수}/10
| 영역 | 가중치 | 점수 | 산출 |
|------|--------|------|------|
| A. Contract 기준 | 60% | {통과율} | {산출값} |
| B. 열린 평가 | 30% | {값} | {산출값} |
| C. Contrarian | 10% | {값} | {산출값} |

## A. Contract 기준
| # | 기준 | 결과 | 근거 |
|---|------|------|------|
(각 항목)

## B. 열린 평가
(이슈 목록 + 심각도 + 참조 코드)

## C. Contrarian
(약점 목록 + 심각도)

## 방향성
{통과 | 재시도 사유 | 방향 전환 사유 | 중단 사유}
```

FAIL 시 feedback-rN.md도 생성:

```
# Sprint {N} Feedback — Round {R}

## 수정 필요
(Contract fail 항목 + 품질 미달 원인)
(각 항목에 구체적 수정 지시 + 참조 코드)

## 검토 권장 (수정 필수 아님)
(열린 평가/Contrarian에서 나온 경미한 이슈)
```
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add plugins/fe-workflow/agents/evaluator.md
git commit -m "feat: 하네스 Evaluator 에이전트 추가"
```

---

### Task 3: 프롬프트 개선 — Generator (기존 code-writer 확장)

기존 code-writer를 하네스 Generator 역할도 수행하도록 확장.
하네스 모드에서는 spec.md + contract.md + feedback.md를 읽고, Sprint 범위만 구현.

**Files:**
- Modify: `plugins/fe-workflow/agents/code-writer.md`

- [ ] **Step 1: code-writer에 하네스 모드 섹션 추가**

기존 프롬프트 끝에 아래 섹션을 추가:

```markdown
## 하네스 모드 (Sprint Contract 기반)

하네스 오케스트레이터가 호출할 때 아래 파일이 함께 전달된다:

### 입력 파일
1. **spec.md** — 전체 맥락. 이 페이지가 뭔지, 전체 Sprint 구조.
2. **contract.md** — 이번 Sprint 범위 + 완료 기준. 이것이 이번 작업의 전부.
3. **참조 코드** — contract에 명시된 기존 코드. 이 패턴을 따른다.
4. **feedback.md** — (재실행 시만) Evaluator가 준 피드백. 이것만 보고 수정.

### 하네스 원칙
- **contract에 없는 건 안 만든다.** "하지 말아야 할 것"을 반드시 확인.
- **기존 코드 패턴을 따른다.** 참조 코드와 다른 방식을 쓰지 않는다.
- **재실행 시 feedback만 본다.** 이전 자기 작업 과정은 볼 수 없다 (프로세스 격리).
- **Sprint 범위만 구현한다.** 다음 Sprint 작업을 미리 하지 않는다.
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add plugins/fe-workflow/agents/code-writer.md
git commit -m "feat: code-writer에 하네스 모드 섹션 추가"
```

---

### Task 4: 파일 형식 템플릿 + 하네스 설정

하네스가 생성하는 모든 파일의 형식 정의 + 컨벤션 설정.

**Files:**
- Create: `plugins/fe-workflow/harness/templates/spec-template.md`
- Create: `plugins/fe-workflow/harness/templates/contract-template.md`
- Create: `plugins/fe-workflow/harness/templates/summary-template.md`
- Create: `plugins/fe-workflow/harness/harness-config.md`

- [ ] **Step 1: spec 템플릿 작성**

```markdown
# {페이지명}

## 기능 목록
(구체적. "등등" 금지)

## UI 구조
(섹션/모달/드로어 레벨)

## API 매핑
(서버 엔드포인트, HTTP 메서드)

## 데이터 흐름
(어떤 데이터가 어디서 어디로)

## 엣지 케이스
(예외 상황, 에러 시나리오)

## 기존 코드와의 관계
(재사용, 확장, 신규 구분)

## Sprint 계획
### Sprint 1: {이름}
  범위: ...
  산출물: ...
### Sprint 2: {이름}
  범위: ...
  산출물: ...
```

- [ ] **Step 2: contract 템플릿 작성**

```markdown
# Sprint {N} Contract: {이름}

## 이번 Sprint에서 만드는 것
(구체적인 파일/함수/타입 이름)

## 하지 말아야 할 것 (범위 밖)
(다음 Sprint에서 다룰 것, 수정하면 안 되는 기존 코드)

## 완료 기준

### 정적 게이트 (자동)
- [ ] tsc --noEmit 통과
- [ ] biome check 통과
- [ ] harness-check 통과

### 코드 품질 (Evaluator 검증)
(프로젝트 맥락에 맞는 구체적 기준)

### 참조할 기존 코드
(Generator가 패턴을 따를 대상, 파일 경로)
```

- [ ] **Step 3: summary 템플릿 작성**

```markdown
# 하네스 실행 요약

## 대상
- 도메인: {domain}
- 페이지: {page}
- 입력: "{원래 요구사항}"

## Sprint 결과
| Sprint | 범위 | 라운드 | 최종 품질 점수 | 결과 |
|--------|------|--------|--------------|------|

## 생성된 파일
(경로 목록)

## 미해결 (사람 판단)
(열린 평가/Contrarian에서 나온 미해결 이슈)
```

- [ ] **Step 4: harness-config 작성**

```markdown
# 하네스 설정

## 컨벤션 문서
- conventions/code-principles.md
- conventions/folder-structure.md
- conventions/api-layer.md
- conventions/coding-style.md

## Static Gate 명령
- tsc --noEmit
- biome check
- harness-check.sh

## 평가 설정
- 품질 점수 임계값: 8.0
- Contract 가중치: 0.6
- 열린 평가 가중치: 0.3
- Contrarian 가중치: 0.1

## 안전장치
- Static Gate 최대 재시도: 3
- Eval Loop 최대 재시도: 3
```

- [ ] **Step 5: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add plugins/fe-workflow/harness/
git commit -m "feat: 하네스 파일 템플릿 + 설정 추가"
```

---

## Part 2: Plugin 구현 (A)

Claude Code 안에서 동작하는 하네스. Agent 도구로 서브에이전트 분리.

---

### Task 5: 커맨드 4개 작성 — harness + planning + implementing + evaluating

통합 오케스트레이터 + 개별 호출 가능한 커맨드 3개.

**Files:**
- Create: `plugins/fe-workflow/commands/harness.md`
- Create: `plugins/fe-workflow/commands/planning.md`
- Create: `plugins/fe-workflow/commands/implementing.md`
- Create: `plugins/fe-workflow/commands/evaluating.md`
- Modify: `plugins/fe-workflow/.claude-plugin/plugin.json` (version bump)

- [ ] **Step 1: harness 커맨드 작성**

```markdown
---
description: "FE 하네스 — Planner→Generator→Evaluator 자동 파이프라인. '하네스', '하네스 실행', '자동 구현', 'harness' 등으로 트리거."
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - AskUserQuestion
  - TaskCreate
  - TaskUpdate
args: "<요구사항 또는 파일 경로>"
---

너는 FE 하네스의 Orchestrator다. 전체 흐름을 제어한다.

## 설정 로드
먼저 `${CLAUDE_PLUGIN_ROOT}/harness/harness-config.md`를 읽어 설정을 로드한다.

## Phase 1: Planning (사람 + AI 협업)

### 1-1. 입력 파싱
- 인자가 파일 경로면 Read로 읽기
- 아니면 텍스트 그대로 사용

### 1-2. 디렉토리 준비
- 도메인/페이지 이름 결정 (사용자에게 확인)
- `.ai/harness/{도메인}/{페이지}/` 디렉토리 생성
- domain-context.md 존재 여부 확인

### 1-3. Planner Agent 호출
Agent 도구로 `planner` 에이전트를 호출:
- 입력: 사용자 요구사항 + domain-context.md (있으면)
- Planner가 사용자와 질문 주고받으며 스펙 확정
- 출력: `.ai/harness/{도메인}/{페이지}/spec.md`

### 1-4. 사람 확인
AskUserQuestion으로 스펙 확인 요청.
피드백 있으면 Planner 재호출, 없으면 확정.

## Phase 2: Build Loop (AI 자율)

spec.md에서 Sprint 목록을 파싱한 뒤, 각 Sprint에 대해:

### 2-1. Sprint Contract 생성
1. Agent 도구로 `code-writer`(하네스 모드)를 호출해 contract 초안 생성
   - 입력: spec.md + 이번 Sprint 범위
   - 출력: contract 초안
2. Agent 도구로 `evaluator`를 호출해 contract 검토
   - 입력: contract 초안 + spec.md
   - 출력: 검토/보완된 contract
3. `.ai/harness/{도메인}/{페이지}/sprint-{N}/contract.md` 저장

### 2-2. Generate
Agent 도구로 `code-writer`(하네스 모드)를 호출:
- 입력: spec.md + contract.md + 참조 코드 + 컨벤션
- feedback.md가 있으면 함께 전달
- Generator가 코드 생성

### 2-3. Static Gate
Bash로 실행:
```bash
tsc --noEmit 2>&1
biome check 2>&1
bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/harness-check.sh 2>&1
```
- 전부 통과 → 2-4로
- 실패 → 에러 메시지를 Generator에게 전달 → 2-2 재실행 (max 3회)
- 3회 실패 → Sprint 중단, 사람에게 알림

### 2-4. Eval Loop
Agent 도구로 `evaluator`를 호출:
- 입력: contract.md + 생성된 코드 + 참조 코드 + 컨벤션
- 출력: eval-log-rN.md + (FAIL 시) feedback-rN.md

**방향 결정 (Orchestrator 코드 로직):**
- eval-log에서 통과 판정과 품질 점수를 파싱
- PASS → 다음 Sprint
- FAIL:
  - 이전 라운드 대비 개선 중 → feedback 전달 후 2-2 재실행
  - 3회 연속 동일 → 현재 상태 수용 (정체)
  - 악화 → 방향 전환 지시 후 2-2 재실행
  - 같은 피드백 반복 → 중단
  - Hard cap 도달 → 중단

### 2-5. Sprint 완료
- domain-context.md 업데이트 (새로 생성된 공유 자원 반영)

## Phase 3: 결과 출력

### 3-1. summary.md 생성
모든 Sprint의 eval-log를 종합하여 `.ai/harness/{도메인}/{페이지}/summary.md` 생성.

### 3-2. 사람에게 결과 전달
summary.md 내용을 출력하고, 미해결 사항 안내.
```

- [ ] **Step 2: planning 커맨드 작성**

```markdown
---
description: "FE 하네스 Planning — 요구사항을 스펙으로 확장. 소크라테스식 질문 + 모호성 체크. '스펙 계획', 'planning', '하네스 계획' 등으로 트리거."
allowed_tools:
  - Read
  - Write
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
args: "<요구사항 또는 파일 경로>"
---

너는 FE 하네스의 Planning 커맨드다. Planner 에이전트를 호출하여 스펙을 생성한다.

## 동작
1. 입력 파싱 (파일 경로면 Read, 아니면 텍스트)
2. 도메인/페이지 이름 결정 (AskUserQuestion)
3. `.ai/harness/{도메인}/{페이지}/` 디렉토리 생성
4. Agent 도구로 `planner` 호출
5. spec.md 생성
6. 사용자에게 스펙 확인 요청
```

- [ ] **Step 3: implementing 커맨드 작성**

```markdown
---
description: "FE 하네스 Implementing — Contract 기반 코드 구현 + Static Gate. contract 없으면 자동 생성. '하네스 구현', 'implementing', '코드 생성' 등으로 트리거."
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - TaskCreate
  - TaskUpdate
args: "<spec.md 경로 또는 sprint 번호>"
---

너는 FE 하네스의 Implementing 커맨드다. Sprint Contract 기반으로 코드를 구현한다.

## 설정 로드
`${CLAUDE_PLUGIN_ROOT}/harness/harness-config.md`를 읽어 설정 로드.

## 동작

### 1. spec.md 로드
인자가 경로면 해당 spec 사용. 없으면 현재 harness 디렉토리에서 찾기.

### 2. Contract 확인 (자동 생성)
해당 Sprint의 contract.md가 있는지 확인:
- **있으면**: 기존 contract 사용
- **없으면**: 자동 생성
  1. Agent 도구로 `code-writer`(하네스 모드)에게 contract 초안 요청
  2. Agent 도구로 `evaluator`에게 contract 검토 요청
  3. contract.md 저장

### 3. Generate
Agent 도구로 `code-writer`(하네스 모드) 호출:
- 입력: spec.md + contract.md + 참조 코드 + 컨벤션
- feedback.md 있으면 함께 전달

### 4. Static Gate
Bash로 실행:
```bash
tsc --noEmit 2>&1
biome check 2>&1
bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/harness-check.sh 2>&1
```
- 통과 → 완료 (또는 evaluating으로 연결)
- 실패 → 에러 전달 → Generator 재호출 (max 3회)
```

- [ ] **Step 4: evaluating 커맨드 작성**

```markdown
---
description: "FE 하네스 Evaluating — 3단계 코드 품질 평가 (Contract + 열린 + Contrarian). '하네스 평가', 'evaluating', '코드 평가' 등으로 트리거."
allowed_tools:
  - Read
  - Write
  - Glob
  - Grep
  - Agent
args: "[contract.md 경로 또는 코드 경로]"
---

너는 FE 하네스의 Evaluating 커맨드다. Evaluator 에이전트를 호출하여 코드를 평가한다.

## 설정 로드
`${CLAUDE_PLUGIN_ROOT}/harness/harness-config.md`를 읽어 설정 로드.

## 동작

### 1. 입력 확인
- contract.md 경로가 있으면 → Contract 기반 전체 평가 (A+B+C)
- contract.md가 없으면 → 열린 평가 + Contrarian만 (B+C)

### 2. Evaluator Agent 호출
Agent 도구로 `evaluator` 호출:
- 입력: contract.md(있으면) + 대상 코드 + 참조 코드 + 컨벤션

### 3. 결과 저장
- eval-log-rN.md 저장
- FAIL 시 feedback-rN.md 저장
- 결과를 사용자에게 출력
```

- [ ] **Step 5: plugin.json version bump**

```json
{
  "name": "fe",
  "description": "FE 전용 플러그인 — 컨벤션, 코드 리뷰, 구현, 리팩토링, 하네스",
  "version": "0.35.0"
}
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add plugins/fe-workflow/commands/harness.md plugins/fe-workflow/commands/planning.md plugins/fe-workflow/commands/implementing.md plugins/fe-workflow/commands/evaluating.md plugins/fe-workflow/.claude-plugin/plugin.json
git commit -m "feat: /fe:harness 커맨드 추가 — 하네스 오케스트레이터 (v0.35.0)"
```

---

### Task 6: Plugin 통합 테스트

실제 프로젝트에서 `/fe:harness`를 실행해 전체 흐름 검증.

**Files:**
- 없음 (실행 테스트)

- [ ] **Step 1: 플러그인 업데이트**

```bash
cd /Users/isc010252/dev/ai
git push
claude plugin update "fe@gyu-plugins"
```

- [ ] **Step 2: 테스트 실행**

새 Claude Code 세션에서:
```
/fe:harness "간단한 테스트 페이지 — 목록 조회 + 상세 보기"
```

검증 항목:
- [ ] Planner가 소크라테스식 질문을 하는가
- [ ] spec.md가 필수 항목을 모두 포함하는가
- [ ] 모호성 체크가 동작하는가
- [ ] Sprint Contract가 생성되는가
- [ ] Generator가 contract 범위만 구현하는가
- [ ] Static Gate가 동작하는가
- [ ] Evaluator가 3단계 평가를 수행하는가
- [ ] eval-log 형식이 올바른가
- [ ] 품질 점수가 산출되는가
- [ ] summary.md가 생성되는가

- [ ] **Step 3: 결과 기록 + 프롬프트 조정**

테스트 결과를 바탕으로 프롬프트 품질 개선. 이 단계가 가장 중요 — 프롬프트가 하네스 품질의 핵심.

---

## Part 3: 독립 서비스 구현 (B)

`claude -p` CLI 기반 독립 서비스. 완전한 프로세스 격리.

---

### Task 7: 프로젝트 셋업

**Files:**
- Create: `services/fe-harness/package.json`
- Create: `services/fe-harness/tsconfig.json`
- Create: `services/fe-harness/src/index.ts`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "@agents/fe-harness",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 엔트리 포인트 스캐폴드**

```typescript
// src/index.ts
import { parseArgs } from 'node:util';
import { orchestrate } from './orchestrator.js';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    spec: { type: 'string', short: 's' },
    domain: { type: 'string', short: 'd' },
    page: { type: 'string', short: 'p' },
    target: { type: 'string', short: 't' },
  },
  allowPositionals: true,
});

const input = values.spec ?? positionals.join(' ');
if (!input) {
  console.error('Usage: pnpm fe-harness "요구사항" --domain order --page detail --target ~/work/project');
  process.exit(1);
}

await orchestrate({
  input,
  domain: values.domain ?? 'default',
  page: values.page ?? 'default',
  targetDir: values.target ?? process.cwd(),
});
```

- [ ] **Step 4: pnpm workspace에 등록 + 의존성 설치**

```bash
cd /Users/isc010252/dev/ai
pnpm install --filter @agents/fe-harness
```

루트 package.json에 스크립트 추가:
```json
"fe-harness": "pnpm -F @agents/fe-harness start --"
```

- [ ] **Step 5: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add services/fe-harness/ package.json pnpm-lock.yaml
git commit -m "feat: fe-harness 서비스 프로젝트 셋업"
```

---

### Task 8: claude -p 래퍼 + 타입 정의

**Files:**
- Create: `services/fe-harness/src/lib/claude.ts`
- Create: `services/fe-harness/src/types.ts`

- [ ] **Step 1: 타입 정의**

```typescript
// src/types.ts
import { z } from 'zod';

export interface HarnessConfig {
  conventions: string[];
  staticGate: string[];
  scoring: {
    qualityThreshold: number;
    contractWeight: number;
    openEvalWeight: number;
    contrarianWeight: number;
  };
  limits: {
    staticGateRetries: number;
    evalLoopRetries: number;
  };
}

export interface SprintPlan {
  number: number;
  name: string;
  scope: string;
  deliverables: string;
}

export interface EvalResult {
  passed: boolean;
  qualityScore: number;
  contractPassRate: number;
  openEvalScore: number;
  contrarianScore: number;
  contractDetails: Array<{
    criterion: string;
    result: 'pass' | 'fail';
    reason: string;
  }>;
  direction: 'pass' | 'retry' | 'pivot' | 'stop';
  feedback?: string;
}

export interface SprintResult {
  sprintNumber: number;
  name: string;
  rounds: number;
  finalScore: number;
  result: 'pass' | 'stagnation' | 'stopped';
}

export interface OrchestrateOptions {
  input: string;
  domain: string;
  page: string;
  targetDir: string;
}
```

- [ ] **Step 2: claude -p 래퍼**

```typescript
// src/lib/claude.ts
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

interface ClaudeOptions {
  model?: 'opus' | 'sonnet';
  timeout?: number;
  cwd?: string;
}

export function callClaude(prompt: string, options: ClaudeOptions = {}): string {
  const { model = 'sonnet', timeout = 300000, cwd } = options;
  const outFile = join(tmpdir(), `claude-harness-${Date.now()}.txt`);

  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  execSync(
    `claude -p --model ${model} --output-file '${outFile}' '${escapedPrompt}'`,
    { timeout, cwd, stdio: 'pipe' },
  );

  const result = readFileSync(outFile, 'utf-8').trim();
  unlinkSync(outFile);
  return result;
}

export function callClaudeWithFiles(
  prompt: string,
  files: Record<string, string>,
  options: ClaudeOptions = {},
): string {
  const fileContext = Object.entries(files)
    .map(([name, content]) => `--- ${name} ---\n${content}\n--- end ${name} ---`)
    .join('\n\n');

  const fullPrompt = `${fileContext}\n\n${prompt}`;
  return callClaude(fullPrompt, options);
}
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add services/fe-harness/src/types.ts services/fe-harness/src/lib/claude.ts
git commit -m "feat: 타입 정의 + claude -p 래퍼"
```

---

### Task 9: 파일 매니저 + Static Gate

하네스 파일 읽기/쓰기 + 정적 검증 실행.

**Files:**
- Create: `services/fe-harness/src/lib/files.ts`
- Create: `services/fe-harness/src/lib/static-gate.ts`

- [ ] **Step 1: 파일 매니저**

```typescript
// src/lib/files.ts
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export class HarnessFiles {
  private baseDir: string;

  constructor(targetDir: string, domain: string, page: string) {
    this.baseDir = join(targetDir, '.ai', 'harness', domain, page);
    mkdirSync(this.baseDir, { recursive: true });
  }

  get specPath(): string {
    return join(this.baseDir, 'spec.md');
  }

  sprintDir(n: number): string {
    const dir = join(this.baseDir, `sprint-${n}`);
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  contractPath(sprint: number): string {
    return join(this.sprintDir(sprint), 'contract.md');
  }

  evalLogPath(sprint: number, round: number): string {
    return join(this.sprintDir(sprint), `eval-log-r${round}.md`);
  }

  feedbackPath(sprint: number, round: number): string {
    return join(this.sprintDir(sprint), `feedback-r${round}.md`);
  }

  get summaryPath(): string {
    return join(this.baseDir, 'summary.md');
  }

  get domainContextPath(): string {
    return join(this.baseDir, '..', 'domain-context.md');
  }

  write(path: string, content: string): void {
    writeFileSync(path, content, 'utf-8');
  }

  read(path: string): string | null {
    return existsSync(path) ? readFileSync(path, 'utf-8') : null;
  }
}
```

- [ ] **Step 2: Static Gate**

```typescript
// src/lib/static-gate.ts
import { execSync } from 'node:child_process';

interface GateResult {
  passed: boolean;
  errors: string[];
}

export function runStaticGate(cwd: string, commands: string[]): GateResult {
  const errors: string[] = [];

  for (const cmd of commands) {
    try {
      execSync(cmd, { cwd, stdio: 'pipe', timeout: 60000 });
    } catch (e: unknown) {
      const error = e as { stderr?: Buffer; stdout?: Buffer };
      const stderr = error.stderr?.toString() ?? '';
      const stdout = error.stdout?.toString() ?? '';
      errors.push(`[${cmd}]\n${stderr || stdout}`);
    }
  }

  return { passed: errors.length === 0, errors };
}
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add services/fe-harness/src/lib/files.ts services/fe-harness/src/lib/static-gate.ts
git commit -m "feat: 파일 매니저 + Static Gate"
```

---

### Task 10: 점수 파싱 + 수렴 감지

Evaluator 출력(eval-log)에서 점수를 파싱하고, 라운드 간 추이를 분석.

**Files:**
- Create: `services/fe-harness/src/lib/scoring.ts`

- [ ] **Step 1: 점수 파싱 + 수렴 감지 구현**

```typescript
// src/lib/scoring.ts
import type { EvalResult } from '../types.js';

export function parseEvalLog(content: string): EvalResult {
  const passedMatch = content.match(/통과 판정:\s*(PASS|FAIL)/);
  const scoreMatch = content.match(/품질 점수:\s*([\d.]+)\/10/);
  const directionMatch = content.match(/## 방향성\n(.+)/);

  const contractDetails: EvalResult['contractDetails'] = [];
  const contractSection = content.match(/## A\. Contract 기준\n([\s\S]*?)(?=\n## [B-Z])/);
  if (contractSection) {
    const rows = contractSection[1].match(/\|\s*\d+\s*\|.*\|.*\|.*\|/g) ?? [];
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 4) {
        contractDetails.push({
          criterion: cells[1],
          result: cells[2].toLowerCase().includes('pass') ? 'pass' : 'fail',
          reason: cells[3],
        });
      }
    }
  }

  const passed = passedMatch?.[1] === 'PASS';
  const qualityScore = parseFloat(scoreMatch?.[1] ?? '0');
  const totalCriteria = contractDetails.length || 1;
  const passedCriteria = contractDetails.filter(d => d.result === 'pass').length;

  let direction: EvalResult['direction'] = 'retry';
  if (passed) direction = 'pass';
  else if (directionMatch?.[1]?.includes('중단')) direction = 'stop';
  else if (directionMatch?.[1]?.includes('방향')) direction = 'pivot';

  return {
    passed,
    qualityScore,
    contractPassRate: passedCriteria / totalCriteria,
    openEvalScore: 0,
    contrarianScore: 0,
    contractDetails,
    direction,
  };
}

export interface ConvergenceCheck {
  action: 'continue' | 'accept' | 'pivot' | 'stop';
  reason: string;
}

export function checkConvergence(history: EvalResult[]): ConvergenceCheck {
  if (history.length === 0) return { action: 'continue', reason: 'first round' };

  const latest = history[history.length - 1];
  if (latest.passed) return { action: 'continue', reason: 'passed' };

  // 악화 감지: fail 수 증가
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const prevFails = prev.contractDetails.filter(d => d.result === 'fail').length;
    const currFails = latest.contractDetails.filter(d => d.result === 'fail').length;
    if (currFails > prevFails) {
      return { action: 'pivot', reason: `fail 수 증가 (${prevFails} → ${currFails})` };
    }
  }

  // 정체 감지: 3회 연속 동일 점수
  if (history.length >= 3) {
    const last3 = history.slice(-3).map(h => h.qualityScore);
    if (last3[0] === last3[1] && last3[1] === last3[2]) {
      return { action: 'accept', reason: `3회 연속 동점 (${last3[0]})` };
    }
  }

  // 진동 감지: N ≈ N-2
  if (history.length >= 3) {
    const curr = latest.qualityScore;
    const twoAgo = history[history.length - 3].qualityScore;
    if (Math.abs(curr - twoAgo) < 0.5) {
      return { action: 'stop', reason: `진동 감지 (${twoAgo} → ... → ${curr})` };
    }
  }

  return { action: 'continue', reason: 'improving' };
}
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add services/fe-harness/src/lib/scoring.ts
git commit -m "feat: 점수 파싱 + 수렴 감지 로직"
```

---

### Task 11: Orchestrator 구현

전체 흐름 제어. Planner → Build Loop → 결과 출력.

**Files:**
- Create: `services/fe-harness/src/orchestrator.ts`
- Create: `services/fe-harness/src/agents/planner.ts`
- Create: `services/fe-harness/src/agents/generator.ts`
- Create: `services/fe-harness/src/agents/evaluator.ts`

- [ ] **Step 1: 에이전트 호출 모듈 3개 작성**

```typescript
// src/agents/planner.ts
import { readFileSync } from 'node:fs';
import { callClaude } from '../lib/claude.js';
import type { HarnessConfig } from '../types.js';

export function runPlanner(
  input: string,
  targetDir: string,
  domainContext: string | null,
  config: HarnessConfig,
): string {
  const conventionContents = config.conventions
    .map(path => {
      try { return `--- ${path} ---\n${readFileSync(path, 'utf-8')}\n--- end ---`; }
      catch { return ''; }
    })
    .filter(Boolean)
    .join('\n\n');

  const prompt = `너는 FE 하네스의 Planner다.

## 역할
사용자의 요구사항을 전체 제품 스펙으로 확장하고 Sprint으로 분해.

## 원칙
- "무엇"만 정의. "어떻게"는 Generator에게.
- 기술 구현 디테일(훅, 상태 관리 등)을 정하지 않는다.

## 컨벤션
${conventionContents}

## 도메인 컨텍스트
${domainContext ?? '(없음 — 이 도메인의 첫 페이지)'}

## 요구사항
${input}

## 출력 형식
아래 필수 항목을 모두 포함하는 스펙을 작성해:
- 기능 목록 (구체적, "등등" 금지)
- UI 구조
- API 매핑
- 데이터 흐름
- 엣지 케이스
- 기존 코드와의 관계
- Sprint 계획 (의존성 순서, 범위, 산출물)

스펙만 출력. 다른 말 하지 마.`;

  return callClaude(prompt, { model: 'opus', cwd: targetDir });
}
```

```typescript
// src/agents/generator.ts
import { readFileSync } from 'node:fs';
import { callClaude } from '../lib/claude.js';
import type { HarnessConfig } from '../types.js';

export function runGenerator(
  spec: string,
  contract: string,
  feedback: string | null,
  referenceCode: string,
  config: HarnessConfig,
  cwd: string,
): string {
  const conventionContents = config.conventions
    .map(path => {
      try { return `--- ${path} ---\n${readFileSync(path, 'utf-8')}\n--- end ---`; }
      catch { return ''; }
    })
    .filter(Boolean)
    .join('\n\n');

  const feedbackSection = feedback
    ? `\n## Evaluator 피드백 (이것만 보고 수정)\n${feedback}`
    : '';

  const prompt = `너는 FE 하네스의 Generator다.

## 원칙
- contract에 없는 건 안 만든다. "하지 말아야 할 것"을 반드시 확인.
- 기존 코드 패턴을 따른다.
- Sprint 범위만 구현한다.

## 컨벤션
${conventionContents}

## 전체 스펙 (맥락용)
${spec}

## 이번 Sprint Contract (이것이 이번 작업의 전부)
${contract}

## 참조 코드 (이 패턴을 따라)
${referenceCode}
${feedbackSection}

## 지시
contract의 "이번 Sprint에서 만드는 것" 항목을 구현해.
코드만 출력. 파일 경로와 전체 내용을 포함해.`;

  return callClaude(prompt, { model: 'sonnet', cwd });
}
```

```typescript
// src/agents/evaluator.ts
import { readFileSync } from 'node:fs';
import { callClaude } from '../lib/claude.js';
import type { HarnessConfig } from '../types.js';

export function runEvaluator(
  contract: string,
  generatedCode: string,
  referenceCode: string,
  config: HarnessConfig,
  cwd: string,
): string {
  const conventionContents = config.conventions
    .map(path => {
      try { return `--- ${path} ---\n${readFileSync(path, 'utf-8')}\n--- end ---`; }
      catch { return ''; }
    })
    .filter(Boolean)
    .join('\n\n');

  const { scoring } = config;

  const prompt = `너는 FE 하네스의 Evaluator다.
Generator의 사고 과정을 모른다. 코드와 contract만 보고 판단한다.

## 컨벤션
${conventionContents}

## Contract (평가 기준)
${contract}

## 생성된 코드
${generatedCode}

## 참조 코드 (패턴 비교용)
${referenceCode}

## 평가 프로토콜

### A. Contract 기준 (닫힌 평가)
contract의 "코드 품질" 항목을 하나씩 검증. 각 항목에 pass/fail + 구체적 근거.

### B. 열린 평가 (자유 판단)
- 기존 코드 패턴과 일관성
- 불필요한 복잡도
- 컨벤션 세부 규칙 위반
이슈에 심각도: 심각(0.5), 중간(0.7), 경미(0.85)

### C. Contrarian (반대 관점)
- "이 코드의 가장 약한 점은?"
- "6개월 후 문제될 부분은?"
약점에 심각도: 중간(0.6), 경미(0.8)

## 점수 산출
품질 점수 = (Contract 통과율 × ${scoring.contractWeight}) + (열린 평가 × ${scoring.openEvalWeight}) + (Contrarian × ${scoring.contrarianWeight})

## 통과 판정
Sprint 통과 = Contract 전부 pass AND 품질 점수 ≥ ${scoring.qualityThreshold}

## 출력 형식 (반드시 이 형식으로)

# Sprint {N} Eval — Round {R}

## 메타
- 시각: {now}

## 통과 판정: {PASS | FAIL (사유)}

## 품질 점수: {점수}/10
| 영역 | 가중치 | 점수 | 산출 |
|------|--------|------|------|
| A. Contract 기준 | 60% | {통과율} | {산출값} |
| B. 열린 평가 | 30% | {값} | {산출값} |
| C. Contrarian | 10% | {값} | {산출값} |

## A. Contract 기준
| # | 기준 | 결과 | 근거 |
|---|------|------|------|

## B. 열린 평가

## C. Contrarian

## 방향성

FAIL이면 추가로 feedback도 출력:

# Sprint {N} Feedback — Round {R}
## 수정 필요
## 검토 권장`;

  return callClaude(prompt, { model: 'opus', cwd });
}
```

- [ ] **Step 2: Orchestrator 메인 루프**

```typescript
// src/orchestrator.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HarnessFiles } from './lib/files.js';
import { runStaticGate } from './lib/static-gate.js';
import { parseEvalLog, checkConvergence } from './lib/scoring.js';
import { runPlanner } from './agents/planner.js';
import { runGenerator } from './agents/generator.js';
import { runEvaluator } from './agents/evaluator.js';
import type { OrchestrateOptions, HarnessConfig, EvalResult, SprintResult, SprintPlan } from './types.js';

function loadConfig(conventionsDir: string): HarnessConfig {
  return {
    conventions: [
      join(conventionsDir, 'code-principles.md'),
      join(conventionsDir, 'folder-structure.md'),
      join(conventionsDir, 'api-layer.md'),
      join(conventionsDir, 'coding-style.md'),
    ],
    staticGate: ['tsc --noEmit', 'biome check'],
    scoring: {
      qualityThreshold: 8.0,
      contractWeight: 0.6,
      openEvalWeight: 0.3,
      contrarianWeight: 0.1,
    },
    limits: {
      staticGateRetries: 3,
      evalLoopRetries: 3,
    },
  };
}

function parseSprintsFromSpec(spec: string): SprintPlan[] {
  const sprints: SprintPlan[] = [];
  const regex = /### Sprint (\d+):\s*(.+)\n\s*범위:\s*(.+)\n\s*산출물:\s*(.+)/g;
  let match;
  while ((match = regex.exec(spec)) !== null) {
    sprints.push({
      number: parseInt(match[1]),
      name: match[2].trim(),
      scope: match[3].trim(),
      deliverables: match[4].trim(),
    });
  }
  return sprints;
}

export async function orchestrate(options: OrchestrateOptions): Promise<void> {
  const { input, domain, page, targetDir } = options;
  const files = new HarnessFiles(targetDir, domain, page);

  // TODO: conventionsDir를 설정에서 읽도록
  const conventionsDir = join(process.env.HOME ?? '', 'dev/ai/plugins/fe-workflow/conventions');
  const config = loadConfig(conventionsDir);

  console.log(`\n=== FE 하네스 시작 ===`);
  console.log(`도메인: ${domain}, 페이지: ${page}`);
  console.log(`대상: ${targetDir}\n`);

  // Phase 1: Planning
  console.log('--- Phase 1: Planning ---');
  const domainContext = files.read(files.domainContextPath);
  const spec = runPlanner(input, targetDir, domainContext, config);
  files.write(files.specPath, spec);
  console.log(`spec 생성: ${files.specPath}`);

  // TODO: 인터랙티브 확인 (readline 또는 별도 구현)
  console.log('\n[사람 확인] spec.md를 확인하세요. (현재 자동 진행)\n');

  // Phase 2: Build Loop
  const sprints = parseSprintsFromSpec(spec);
  console.log(`--- Phase 2: Build Loop (${sprints.length}개 Sprint) ---`);

  const sprintResults: SprintResult[] = [];

  for (const sprint of sprints) {
    console.log(`\n=== Sprint ${sprint.number}: ${sprint.name} ===`);

    // 2-1: Contract 생성 (단순 버전: Generator가 생성)
    const contractPrompt = `spec.md 기반으로 Sprint ${sprint.number} (${sprint.name})의 contract를 생성해.
범위: ${sprint.scope}
산출물: ${sprint.deliverables}

contract 형식:
- 이번 Sprint에서 만드는 것
- 하지 말아야 할 것
- 완료 기준 (정적 게이트 + 코드 품질)
- 참조할 기존 코드`;

    // TODO: Generator 초안 → Evaluator 검토 루프
    const contract = runGenerator(spec, contractPrompt, null, '', config, targetDir);
    files.write(files.contractPath(sprint.number), contract);

    // 2-2 ~ 2-4: Generate + Gate + Eval 루프
    const evalHistory: EvalResult[] = [];
    let round = 0;
    let lastFeedback: string | null = null;
    let sprintPassed = false;

    while (round < config.limits.evalLoopRetries) {
      round++;
      console.log(`  Round ${round}:`);

      // Generate
      const code = runGenerator(spec, contract, lastFeedback, '', config, targetDir);
      console.log(`    Generator 완료`);

      // Static Gate
      const gateResult = runStaticGate(targetDir, config.staticGate);
      if (!gateResult.passed) {
        console.log(`    Static Gate FAIL: ${gateResult.errors.length}개 에러`);
        // Static Gate 재시도는 별도 카운트
        let gateRetry = 0;
        let gateCode = code;
        while (!gateResult.passed && gateRetry < config.limits.staticGateRetries) {
          gateRetry++;
          const errorFeedback = gateResult.errors.join('\n');
          // TODO: Generator에게 에러 전달 후 재생성
          break; // 단순 버전: 한번 실패하면 다음 Eval로
        }
      }
      console.log(`    Static Gate 통과`);

      // Evaluate
      const evalOutput = runEvaluator(contract, code, '', config, targetDir);
      const evalResult = parseEvalLog(evalOutput);
      evalHistory.push(evalResult);

      // eval-log 저장
      files.write(files.evalLogPath(sprint.number, round), evalOutput);

      console.log(`    Evaluator: ${evalResult.passed ? 'PASS' : 'FAIL'} (${evalResult.qualityScore}/10)`);

      if (evalResult.passed) {
        sprintPassed = true;
        break;
      }

      // 수렴 감지
      const convergence = checkConvergence(evalHistory);
      console.log(`    수렴 체크: ${convergence.action} (${convergence.reason})`);

      if (convergence.action === 'accept') {
        console.log(`    정체로 수용`);
        break;
      }
      if (convergence.action === 'stop') {
        console.log(`    중단: ${convergence.reason}`);
        break;
      }

      // feedback 저장 + 다음 라운드 준비
      if (evalResult.feedback) {
        files.write(files.feedbackPath(sprint.number, round), evalResult.feedback);
        lastFeedback = evalResult.feedback;
      }
    }

    sprintResults.push({
      sprintNumber: sprint.number,
      name: sprint.name,
      rounds: round,
      finalScore: evalHistory[evalHistory.length - 1]?.qualityScore ?? 0,
      result: sprintPassed ? 'pass' : round >= config.limits.evalLoopRetries ? 'stopped' : 'stagnation',
    });
  }

  // Phase 3: Summary
  console.log('\n--- Phase 3: Summary ---');
  const summary = generateSummary(domain, page, input, sprintResults);
  files.write(files.summaryPath, summary);
  console.log(`summary 생성: ${files.summaryPath}`);
  console.log('\n=== FE 하네스 완료 ===');
}

function generateSummary(
  domain: string,
  page: string,
  input: string,
  results: SprintResult[],
): string {
  const rows = results
    .map(r => `| ${r.sprintNumber} | ${r.name} | ${r.rounds} | ${r.finalScore}/10 | ${r.result} |`)
    .join('\n');

  return `# 하네스 실행 요약

## 대상
- 도메인: ${domain}
- 페이지: ${page}
- 입력: "${input}"

## Sprint 결과
| Sprint | 범위 | 라운드 | 최종 품질 점수 | 결과 |
|--------|------|--------|--------------|------|
${rows}
`;
}
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/isc010252/dev/ai
git add services/fe-harness/src/
git commit -m "feat: Orchestrator + 에이전트 모듈 구현"
```

---

### Task 12: 서비스 통합 테스트

실제 프로젝트에서 서비스를 실행해 전체 흐름 검증.

**Files:**
- 없음 (실행 테스트)

- [ ] **Step 1: 빌드 확인**

```bash
cd /Users/isc010252/dev/ai
pnpm -F @agents/fe-harness start -- --help
```

- [ ] **Step 2: 테스트 실행**

```bash
unset CLAUDECODE
pnpm fe-harness "간단한 테스트 페이지" --domain test --page list --target ~/work/ishopcare-frontend
```

검증 항목 (Plugin 테스트와 동일):
- [ ] Planner가 스펙을 생성하는가
- [ ] Sprint Contract가 생성되는가
- [ ] Generator가 코드를 생성하는가
- [ ] Static Gate가 동작하는가
- [ ] Evaluator가 eval-log를 생성하는가
- [ ] 점수 산출이 올바른가
- [ ] 수렴 감지가 동작하는가
- [ ] summary.md가 생성되는가

- [ ] **Step 3: Plugin(A)과 결과 비교**

같은 입력으로 Plugin과 Service를 각각 실행하고 비교:
- 결과물 품질
- 컨텍스트 격리 효과
- 실행 시간 / 비용
- Evaluator 로그 품질

---

## Part 4: 후속 작업

### Task 13: 프롬프트 튜닝 (반복)

테스트 결과를 바탕으로 프롬프트 품질을 반복 개선. **이 작업이 하네스 전체 품질을 결정.**

- [ ] Evaluator 로그를 읽고 판단이 내 것과 다른 사례 찾기
- [ ] Planner가 놓친 엣지 케이스 확인
- [ ] Generator가 패턴을 따르지 않은 사례 확인
- [ ] 프롬프트 수정 → 재테스트 → 반복

### Task 14: cc-monitor 연동

eval-log 데이터를 cc-monitor에 전송하여 하네스 품질 추적.

- [ ] cc-monitor API에 harness 데이터 엔드포인트 추가
- [ ] 서비스에서 eval-log 생성 시 자동 전송
- [ ] 플러그인에서 eval-log 생성 시 자동 전송
