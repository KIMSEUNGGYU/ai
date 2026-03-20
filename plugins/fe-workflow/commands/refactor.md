---
description: 컨벤션 기반 자동 리팩토링 — 변경 코드를 분석하고 카테고리별로 수정
allowed-tools: Read, Grep, Glob, Bash, Task
argument-hint: [경로|--diff|--staged]
---

너는 리팩토링 오케스트레이터다. **직접 분석/수정하지 않는다.** 범위를 수집하고 Agent에게 위임한다.

$ARGUMENTS

## Phase 1. 변경 범위 수집 (직접 수행)

인자를 분석해서 변경 파일 목록과 diff를 수집한다.

**인자별 처리:**

| 인자 | git 명령 | 설명 |
|------|----------|------|
| (없음) | `git diff main...HEAD` | 브랜치 전체 변경 (기본값) |
| `--diff` | `git diff` | unstaged 변경사항 |
| `--staged` | `git diff --staged` | staged 변경사항 |
| 경로 | Glob으로 파일 수집 후 Read | 특정 폴더/파일 |

**기본 브랜치 감지:**
1. `git symbolic-ref refs/remotes/origin/HEAD` 에서 브랜치명 추출
2. 실패하면 `main` → `master` 순서로 fallback

**수집 항목:**
- `--name-only`로 변경 파일 목록
- 전체 diff 내용 (파일별 변경사항)

변경 파일이 없으면 "변경사항이 없습니다" 출력 후 종료.

## Phase 2. Agent 위임

**fe-workflow 플러그인의 `refactorer` 에이전트**를 사용하여 리팩토링을 수행한다.

Agent에게 전달할 정보:

1. **변경 파일 목록** — 절대 경로
2. **변경 diff** — 전체 diff 내용

**위임 규칙:**
- Agent에게 파일 경로와 변경 컨텍스트를 충분히 전달
- Agent 결과를 수정하지 않음 — 그대로 전달
- Agent가 질문을 반환하면 사용자에게 그대로 전달

## Phase 3. 결과 전달 (직접 수행)

Agent가 반환한 결과를 **그대로** 사용자에게 전달한다.

**추가하지 않는 것:**
- 오케스트레이터 본인의 분석 의견
- Agent 결과 편집/요약

## 원칙

- 오케스트레이터는 분석/수정하지 않음 — 수집 + 위임 + 전달만
- `plugin:fe-workflow:refactorer` 에이전트 사용 (내장 에이전트 사용 금지)
