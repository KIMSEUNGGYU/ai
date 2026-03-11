# /fe:refactor 커맨드 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fe-workflow 플러그인에 컨벤션 기반 자동 리팩토링 커맨드 추가

**Architecture:** `/fe:refactor` 커맨드가 git diff로 변경 범위를 수집하고, `refactorer` 에이전트에 위임하여 컨벤션 기반 분석 + 카테고리별 수정을 수행

**Tech Stack:** Claude Code Plugin (markdown commands/agents)

**Spec:** `.ai/specs/fe-refactor-command.md`

---

## 파일 구조

| 작업 | 파일 | 책임 |
|------|------|------|
| 생성 | `agents/refactorer.md` | 컨벤션 기반 분석 + 코드 수정 에이전트 |
| 생성 | `commands/refactor.md` | 커맨드 진입점 — 범위 수집 + 에이전트 위임 |
| 삭제 | `agents/refactor-analyzer.md` | refactorer로 대체 |
| 수정 | `.claude-plugin/plugin.json` | version 0.21.1 → 0.22.0 |

---

## Task 1: refactorer 에이전트 생성

**Files:**
- Create: `plugins/fe-workflow/agents/refactorer.md`

- [ ] **Step 1: 에이전트 파일 생성**

`agents/refactorer.md` 를 생성한다. 기존 `code-reviewer.md` 패턴을 참고하되, 이 에이전트는 **읽기+쓰기 모두 가능**하다.

핵심 구조:
- frontmatter: name, description, model(sonnet), allowed-tools(Read, Write, Edit, Glob, Grep, Bash)
- 역할 정의: 컨벤션 기반 분석 + 코드 수정
- 프로토콜 4단계:
  1. 컨벤션 5개 문서 필수 Read
  2. 변경 파일 분석 → 위반사항 식별 → 영향도 3단계 분류 (구조/로직/스타일)
  3. 분석 리포트 출력 (각 항목: 위반 컨벤션 + 근거 + before/after)
  4. 카테고리별 수정 (AskUserQuestion으로 확인 → 수정 → 결과 요약)

카테고리 분류 기준:
- **구조 변경**: folder-structure.md 위반 (파일 위치), code-principles.md 추상화 (컴포넌트/훅 추출)
- **로직 변경**: api-layer.md 패턴 위반, code-principles.md SSOT/SRP/응집도, error-handling.md 패턴
- **스타일 변경**: coding-style.md 전체, code-principles.md 가독성/인지부하

리포트 항목 형식:
```markdown
### [카테고리] 항목명

**위반 컨벤션**: {파일명} > {섹션명}
**근거**: {구체적 설명}

**Before:**
```tsx
// 현재 코드
```

**After:**
```tsx
// 수정된 코드
```
```

원칙:
- conventions 파일을 반드시 Read로 읽고 기준 적용 (암기 의존 금지)
- 이른 추상화 안티패턴(code-principles.md DON'T 섹션) 주의 — 불필요한 추출 제안 금지
- 각 카테고리 수정 전 반드시 사용자 확인
- 구조 → 로직 → 스타일 순서 엄수 (파일 이동 후 로직 수정, 로직 수정 후 스타일)

- [ ] **Step 2: 커밋**

```bash
git add plugins/fe-workflow/agents/refactorer.md
git commit -m "feat: refactorer 에이전트 추가"
```

---

## Task 2: /fe:refactor 커맨드 생성

**Files:**
- Create: `plugins/fe-workflow/commands/refactor.md`

- [ ] **Step 1: 커맨드 파일 생성**

`commands/refactor.md`를 생성한다. 기존 `review.md` 패턴을 참고.

frontmatter:
```yaml
---
description: 컨벤션 기반 자동 리팩토링 — 변경 코드를 분석하고 카테고리별로 수정
allowed-tools: Read, Grep, Glob, Bash, Agent
argument-hint: [경로|--diff|--staged]
---
```

워크플로우:

**Phase 1. 변경 범위 수집 (직접 수행)**

인자 파싱 → git diff 실행 → 변경 파일 목록 수집.

| 인자 | git 명령 | 설명 |
|------|----------|------|
| (없음) | `git diff main...HEAD --name-only` | 브랜치 전체 변경 |
| `--diff` | `git diff --name-only` | unstaged 변경 |
| `--staged` | `git diff --staged --name-only` | staged 변경 |
| 경로 | 해당 경로의 파일 목록 | 특정 폴더/파일 |

변경 파일이 없으면 "변경사항이 없습니다" 출력 후 종료.

diff 내용도 함께 수집 (`--name-only` 제거한 full diff).

**Phase 2. Agent 위임**

```
Agent(
  subagent_type = "plugin:fe-workflow:refactorer",
  prompt = "
    아래 변경사항을 컨벤션 기준으로 분석하고 리팩토링해줘.

    conventions 경로 (반드시 Read로 읽고 기준 적용):
    - {플러그인 루트}/conventions/code-principles.md
    - {플러그인 루트}/conventions/folder-structure.md
    - {플러그인 루트}/conventions/api-layer.md
    - {플러그인 루트}/conventions/error-handling.md
    - {플러그인 루트}/conventions/coding-style.md

    변경 파일 목록:
    - {파일 경로 목록 — 절대 경로}

    변경 diff:
    {full diff 내용}
  "
)
```

conventions 경로는 이 Command가 로드된 디렉토리 기준으로 절대 경로 생성.

**Phase 3. 결과 전달**

Agent 결과를 그대로 사용자에게 전달.

원칙:
- 오케스트레이터는 분석/수정하지 않음 — 수집 + 위임 + 전달만
- Agent 호출 시 `plugin:fe-workflow:refactorer` 명시
- 기본 브랜치 감지: `git symbolic-ref refs/remotes/origin/HEAD` 또는 fallback으로 main/master 시도

- [ ] **Step 2: 커밋**

```bash
git add plugins/fe-workflow/commands/refactor.md
git commit -m "feat: /fe:refactor 커맨드 추가"
```

---

## Task 3: refactor-analyzer 삭제 + plugin.json 버전 업데이트

**Files:**
- Delete: `plugins/fe-workflow/agents/refactor-analyzer.md`
- Modify: `plugins/fe-workflow/.claude-plugin/plugin.json`

- [ ] **Step 1: refactor-analyzer 삭제**

```bash
rm plugins/fe-workflow/agents/refactor-analyzer.md
```

- [ ] **Step 2: plugin.json 버전 업데이트**

`version`을 `0.21.1` → `0.22.0` (minor bump: 에이전트+커맨드 추가)

- [ ] **Step 3: 커밋**

```bash
git add plugins/fe-workflow/agents/refactor-analyzer.md plugins/fe-workflow/.claude-plugin/plugin.json
git commit -m "feat: refactor-analyzer 제거 + plugin version 0.22.0"
```
