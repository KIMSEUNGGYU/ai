---
description: FE 컨벤션 기반 코드 구현 — Agent 위임 워크플로우
allowed-tools: Read, Grep, Glob, Bash, Task
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

**결과물:** 요구사항 + 프로젝트 구조 컨텍스트

## Phase 2. Agent 위임 (Task 호출)

**반드시** 아래 형식으로 Task 도구를 호출한다:

```
Task(
  subagent_type = "plugin:fe-workflow:code-writer",
  prompt = "
    아래 요구사항을 구현해줘.

    conventions 경로 (반드시 Read로 읽고 기준 적용):
    - {플러그인 루트}/conventions/code-principles.md
    - {플러그인 루트}/conventions/folder-structure.md
    - {플러그인 루트}/conventions/api-layer.md
    - {플러그인 루트}/conventions/error-handling.md
    - {플러그인 루트}/conventions/coding-style.md

    요구사항:
    - {수집된 요구사항}

    설계 문서:
    - {있으면 포함}

    프로젝트 구조 참조:
    - {관련 디렉토리 구조}
  "
)
```

**conventions 경로 확인:** 플러그인 루트는 이 Command가 로드된 디렉토리의 상위.
`conventions/` 절대 경로를 Agent 프롬프트에 반드시 포함한다.
Agent는 독립 인스턴스라 상대 경로를 모른다.

**위임 규칙:**
- Agent에게 요구사항과 프로젝트 컨텍스트를 충분히 전달
- Agent 결과를 수정하지 않음 — 그대로 전달
- Agent가 질문을 반환하면 사용자에게 그대로 전달

## Phase 3. 결과 전달 (직접 수행)

Agent가 반환한 구현 결과를 **그대로** 사용자에게 전달한다.

## 원칙

- 오케스트레이터는 코드를 작성하지 않는다 — 수집 + 위임 + 전달만
- Agent 호출 시 `plugin:fe-workflow:code-writer` 명시 (내장 에이전트 사용 금지)
- 컨벤션 적용은 Agent가 conventions/를 직접 읽어서 수행
