---
description: "완전 자동 PR — (티켓→)브랜치→커밋→푸시→PR 생성을 한번에 실행"
allowed-tools: Read, Bash, Glob, Grep
argument-hint: "[base 브랜치 (선택, 기본: 자동 감지)]"
---

너는 PR 생성 자동화 도우미다. 사용자가 이 커맨드를 실행한 시점에 이미 승인한 것이다.
**절대 중간에 멈추지 않는다.** 브랜치→커밋→푸시→PR 생성을 한번에 실행한다.

$ARGUMENTS

## 절대 규칙

- 커밋 메시지 확인 질문 금지
- PR 내용 확인 질문 금지
- 중간에 멈추면 실패다
- PR URL 출력까지 한 흐름으로 실행
- Claude attribution 절대 금지 (Co-Authored-By, Generated with, 🤖)

## Step 0. 환경 판별

```bash
BRANCH=$(git branch --show-current)
```

**피처 브랜치** (`fix/ISH-1065`, `feat/something` 등) → Step 0 건너뛰고 Step 1로

**main/master** → 아래 티켓+브랜치 생성 실행:

### 티켓 생성 (이슈 트래커 있을 때만)

Linear MCP가 사용 가능한지 확인한다.

**Linear MCP 있으면:**
변경사항(`git diff`, `git status`)을 분석하여 작업 제목을 자동 결정.

```
mcp__linear-server__create_issue:
  - title: [변경사항에서 추론한 작업 제목]
  - team: 프로젝트에 맞는 팀
  - assignee: me
  - priority: 3
```

타입은 변경 내용에서 자동 판별:
- 버그 수정 → `fix`
- 새 기능 → `feat`
- 리팩토링 → `refactor`
- 그 외 → `chore`

```bash
git checkout -b [type]/[ISSUE-KEY]
```

**Linear MCP 없으면:**
이슈 트래커 스킵. 변경 내용 분석 후 브랜치만 생성.

```bash
# 변경 내용에서 브랜치명 자동 결정
git checkout -b [type]/[간결한-영문-설명]
```

## Step 1. 분석

```bash
# base 브랜치 감지 (인자 없으면 자동)
git rev-parse --verify main >/dev/null 2>&1 && BASE="main" || \
git rev-parse --verify master >/dev/null 2>&1 && BASE="master" || \
BASE="develop"

git status
git diff --cached
git diff
git log ${BASE}..HEAD --oneline
git diff ${BASE}...HEAD --stat
gh pr view --json number,title,body,url 2>/dev/null
```

**인자로 base 브랜치가 주어지면 자동 감지 대신 해당 브랜치 사용.**

**기존 PR 판별:**
- `gh pr view` 성공 → **업데이트 모드**
- 실패 → **신규 생성 모드**

**이슈 키 추출 (브랜치명 파싱):**
- `feat/ISH-1065` → `ISH-1065`
- `fix/PROJ-123` → `PROJ-123`
- 패턴: `[A-Z]+-[0-9]+` 추출, 없으면 이슈 링크 생략

## Step 2. 커밋 (미커밋 변경만)

미커밋 변경이 있으면:
```bash
git add -A
git commit -m "[이슈키] type(scope): 간결한 설명"
```

**커밋 메시지 규칙:**
- 이슈 키 있으면 `[ISH-XXXX]` 접두사
- 타입: feat/fix/refactor/chore/docs/test
- 한국어, 72자 이내

변경 없으면 스킵.

## Step 3. Push

```bash
git push -u origin $(git branch --show-current)
```

## Step 4. PR 생성 또는 업데이트

`/dev:pr`의 Step 4~5와 동일한 로직을 따른다.

### 신규 PR

커밋 히스토리 + diff를 분석해서 PR 설명을 자동 생성.

```markdown
### 왜(Why)

[커밋 메시지들에서 추출한 변경 이유 — 기능 단위로 요약]

### 변경사항(What)

- [기능 단위 변경 요약 1]
- [기능 단위 변경 요약 2]

### 링크

- [이슈키](이슈 URL)  ← 이슈 키 있을 때만
```

### 기존 PR 업데이트

기존 body 유지 + "변경사항(What)" 섹션 끝에 새 항목만 추가.
Why, 링크 섹션은 수정하지 않는다.

## Step 5. 결과 출력

```
완료:
- Branch: [브랜치명]
- PR: [PR_URL] (신규 생성 / 업데이트)
- 이슈: [이슈 URL] (있으면)
```

## 규칙

### MUST
- 한국어로 작성
- 모든 커밋 내용 반영 (최신 커밋만 X)
- PR 설명은 기능 단위 요약 (파일 나열 X)
- 논스톱 실행

### NEVER
- Claude attribution 추가 금지
- 코드 스니펫 포함 금지
- 중간에 사용자에게 질문 금지
