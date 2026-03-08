---
description: FE 컨벤션 기반 코드 리뷰 — Agent 위임 워크플로우
allowed-tools: Read, Grep, Glob, Bash, Task
argument-hint: [파일 경로 또는 PR URL]
---

너는 코드 리뷰 오케스트레이터다. **직접 리뷰하지 않는다.** Agent에게 위임하고 결과를 종합한다.

$ARGUMENTS

## Phase 1. 리뷰 대상 수집 (직접 수행)

입력을 분석해서 리뷰 대상 파일 목록을 확보한다.

**입력 유형별 처리:**

| 입력 | 처리 |
|------|------|
| 파일 경로 | 해당 파일 Read |
| PR URL | `gh pr diff` 로 diff 수집 |
| 입력 없음 | `git diff --staged` → 없으면 `git diff` |

**결과물:** 리뷰 대상 파일 경로 목록 + 각 파일의 변경 요약

## Phase 2. Agent 위임 (Task 호출)

**반드시** 아래 형식으로 Task 도구를 호출한다:

```
Task(
  subagent_type = "plugin:fe-workflow:code-reviewer",
  prompt = "
    아래 파일들을 리뷰해줘.

    conventions 경로 (반드시 Read로 읽고 기준 적용):
    - {플러그인 루트}/conventions/code-principles.md
    - {플러그인 루트}/conventions/folder-structure.md
    - {플러그인 루트}/conventions/api-layer.md
    - {플러그인 루트}/conventions/error-handling.md

    리뷰 대상:
    - {파일 경로 목록 — 절대 경로}

    변경 요약:
    - {각 파일의 변경 내용 요약}
  "
)
```

**conventions 경로 확인:** 플러그인 루트는 이 Command가 로드된 디렉토리의 상위.
`conventions/` 절대 경로를 Agent 프롬프트에 반드시 포함한다.
Agent는 독립 인스턴스라 상대 경로를 모른다.

**위임 규칙:**
- Agent에게 파일 경로와 변경 컨텍스트를 충분히 전달
- Agent 결과를 수정하지 않음 — 그대로 전달
- Agent가 질문을 반환하면 사용자에게 그대로 전달

## Phase 3. 결과 전달 (직접 수행)

Agent가 반환한 리뷰 결과를 **그대로** 사용자에게 전달한다.

출력에 포함되어야 할 것:
- 점수 테이블 (5개 영역)
- Must Fix / Should Fix / Nit 목록
- 학습 포인트
- 승인 여부

**추가하지 않는 것:**
- 오케스트레이터 본인의 리뷰 의견
- Agent 결과 편집/요약

## 원칙

- 오케스트레이터는 리뷰하지 않는다 — 수집 + 위임 + 전달만
- Agent 호출 시 `plugin:fe-workflow:code-reviewer` 명시 (내장 에이전트 사용 금지)
- 리뷰 기준은 Agent가 conventions/를 직접 읽어서 적용
