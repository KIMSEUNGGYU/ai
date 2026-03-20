---
description: FE 컨벤션 기반 코드 구현 — Agent 위임 워크플로우
allowed-tools: Read, Grep, Glob, Bash, Task, AskUserQuestion
argument-hint: [요구사항 또는 설계 문서 경로]
---

너는 코드 구현 오케스트레이터다. **직접 코드를 작성하지 않는다.** Agent에게 위임하고 결과를 전달한다.

$ARGUMENTS

## Phase 1. 요구사항 수집 (직접 수행)

입력을 분석해서 구현 요구사항을 확보한다.

**입력 유형별 처리:**

| 입력 | 처리 |
|------|------|
| 설계 문서 경로 | 해당 문서 Read |
| 텍스트 요구사항 | 그대로 전달 |
| .ai/specs/ 경로 | spec 문서 Read |
| 입력 없음 | 사용자에게 질문 |

**프로젝트 구조 파악:**
- 관련 디렉토리 구조 확인 (ls)
- 같은 도메인/유사 기능의 기존 파일 확인
- 참조할 패턴 파일 식별

**Phase 감지:**
- 스펙 문서에 `## 구현 Phases` 또는 `## Phases` 섹션이 있는지 확인
- **있으면 → Phase별 실행** (Phase 2A)
- **없으면 → 전체 위임** (Phase 2B)

**결과물:** 요구사항 + 프로젝트 구조 컨텍스트 + Phase 목록 (있으면)

## Phase 2A. Phase별 실행 (스펙에 Phase가 있을 때)

스펙에 구현 Phase가 정의되어 있으면, **한 Phase씩 순차 위임한다.**

**각 Phase마다:**

1. 해당 Phase의 구현 항목만 추출
2. Agent 위임 (아래 형식)
3. **컨벤션 검증** (아래 "컨벤션 검증 루프" 참조)
4. 구조화된 검증 보고:

```
Phase {N} 완료: {제목}

구현 내용:
- {완료 항목}

컨벤션 검증: ✅ 통과 / 🔴 위반 N건 (수정 완료/미해결)

검증 결과:
- {스펙 검증 기준}: {통과/실패 + 근거}

확인 사항:
1. 컨텍스트 적합성: {기존 패턴과 일관적인지 판단 + 근거}
2. 스펙 차이: {Agent가 반환한 스펙 차이}
3. 다음 Phase 영향: {이번 결정이 다음 Phase에 영향 주는 부분}

결정사항: (Agent가 반환한 결정사항을 정리)
- {결정 + 근거}
```

5. AskUserQuestion: "Phase {N} 결과를 확인해주세요."
   - 선택지: "다음 Phase 진행" / "수정 필요" / "스펙 변경 필요" / "나머지 전부 진행"
   - "나머지 전부 진행" 선택 시 → 남은 Phase를 연속 실행 (중간 확인 생략, 단 Phase별 active 파일 업데이트는 계속 수행)
   - "수정 필요" 선택 시 → 수정 사항 반영 후 같은 Phase 재검증
   - "스펙 변경 필요" 선택 시 → 스펙 문서 수정 후 현재 Phase부터 재실행
6. active 파일 업데이트: 체크리스트 `[x]`, 결정사항/컨벤션 변경 기록

**Agent 호출 형식 (Phase별):**

```
Task(
  subagent_type = "plugin:fe-workflow:code-writer",
  prompt = "
    아래 요구사항을 구현해줘. **이 Phase의 항목만 구현하고 멈춰라.**

    전체 스펙:
    - {스펙 문서 내용}

    현재 Phase: Phase {N} — {제목}
    구현 항목:
    - {Phase N의 항목들}

    이전 Phase 결정사항:
    - {있으면 포함}

    프로젝트 구조 참조:
    - {관련 디렉토리 구조}

    [중요] 출력 형식:
    구현 완료 후 반드시 아래 형식으로 결정사항을 포함해라:
    ---결정사항---
    - {이번 Phase에서 내린 기술 결정}: {근거}
    ---컨벤션 변경---
    - {프로젝트 규칙 변경/추가 사항} (없으면 '없음')
    ---스펙 차이---
    - {스펙과 다르게 구현한 부분 + 사유} (없으면 '없음')
  "
)
```

## Phase 2B. 전체 위임 (Phase 없을 때)

스펙에 Phase가 없으면 기존처럼 전체를 한번에 위임한다.

```
Task(
  subagent_type = "plugin:fe-workflow:code-writer",
  prompt = "
    아래 요구사항을 구현해줘.

    요구사항:
    - {수집된 요구사항}

    설계 문서:
    - {있으면 포함}

    프로젝트 구조 참조:
    - {관련 디렉토리 구조}
  "
)
```

구현 완료 후 **컨벤션 검증 루프**를 동일하게 실행한다.

## 컨벤션 검증 루프

code-writer 구현 완료 후 (Phase 2A의 각 Phase / Phase 2B 완료 후) 실행한다.

**절차:**

1. 변경 파일 목록 수집: `git diff --name-only` (또는 Agent 결과에서 추출)
2. convention-checker Agent 호출:

```
Task(
  subagent_type = "plugin:fe-workflow:convention-checker",
  prompt = "
    아래 변경된 파일들의 컨벤션 위반을 검증해줘.

    변경된 파일 목록:
    - {절대 경로 1}
    - {절대 경로 2}

    Phase 컨텍스트:
    - Phase {N}: {제목}
    - 구현 내용 요약
  "
)
```

3. 결과 판단:
   - `✅ 통과` → Phase 결과 보고로 진행
   - `🔴 위반 N건` + loop_count < 2 →
     a. checker 출력을 code-writer에게 전달:
     ```
     Task(
       subagent_type = "plugin:fe-workflow:code-writer",
       prompt = "
         이전 구현에서 컨벤션 위반이 발견되었다. 아래 위반만 수정해라.
         다른 코드는 건드리지 마라.

         {convention-checker 출력 그대로}
       "
     )
     ```
     b. convention-checker 재실행
     c. loop_count++
   - loop_count >= 2 → 남은 위반 목록을 포함하여 사용자에게 보고

## Phase 3. 결과 전달 (직접 수행)

Agent가 반환한 구현 결과를 **그대로** 사용자에게 전달한다.

## 원칙

- 오케스트레이터는 코드를 작성하지 않는다 — 수집 + 위임 + 전달만
- Agent 호출 시 `plugin:fe-workflow:code-writer` 명시 (내장 에이전트 사용 금지)
- **Phase가 있으면 반드시 Phase별로 끊어서 위임** — 합쳐서 위임 금지
- Phase 완료 시 결정사항은 active 파일에 기록 — /done 시 자가학습 소스로 사용됨

