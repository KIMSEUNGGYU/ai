---
description: GitHub PR 자동 생성/업데이트 — 커밋 분석 기반 PR 설명 자동 생성
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[base 브랜치 (선택, 기본: 자동 감지)]"
---

너는 PR 생성 오케스트레이터다. 분석 → 커밋 → 푸시 → PR 생성/업데이트를 **논스톱으로 실행**한다.
질문 없이 끝까지 진행한다. 사용자가 `/fe:pr`을 실행한 시점에 이미 승인된 것이다.

$ARGUMENTS

## Step 1. 상태 분석

```bash
# 현재 브랜치
BRANCH=$(git branch --show-current)

# main/master 브랜치면 중단
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "ERROR: main/master 브랜치에서는 PR 생성 불가"
  exit 1
fi

# base 브랜치 감지 (인자 없으면 자동)
# main → master → develop 순으로 존재하는 브랜치 사용
git rev-parse --verify main >/dev/null 2>&1 && BASE="main" || \
git rev-parse --verify master >/dev/null 2>&1 && BASE="master" || \
BASE="develop"

# 기존 PR 확인
gh pr view --json number,title,body,url 2>/dev/null

# 전체 변경 분석
git log ${BASE}..HEAD --oneline
git diff ${BASE}...HEAD --stat
git diff ${BASE}...HEAD
```

**인자로 base 브랜치가 주어지면 자동 감지 대신 해당 브랜치 사용.**

**기존 PR 존재 여부에 따라 모드 결정:**
- `gh pr view` 성공 → **업데이트 모드**
- 실패 → **신규 생성 모드**

**이슈 키 추출 (브랜치명 파싱):**
- `feat/ISH-1065` → `ISH-1065`
- `fix/PROJ-123` → `PROJ-123`
- 패턴: `[A-Z]+-[0-9]+` 추출, 없으면 이슈 링크 생략

## Step 2. 미커밋 변경 처리

`git status`로 staged/unstaged 변경 확인.

**변경 있으면:**
```bash
git add -A
git commit -m "[이슈키] type(scope): 간결한 설명"
```

**커밋 메시지 규칙:**
- 이슈 키 있으면 `[ISH-XXXX]` 접두사
- 타입: feat/fix/refactor/chore/docs/test
- 한국어, 72자 이내
- **Claude attribution 절대 금지** (Co-Authored-By, Generated with 등)

**변경 없으면 스킵.**

## Step 3. Push

```bash
git push -u origin $(git branch --show-current)
```

## Step 4. PR 설명 생성

### 신규 PR

커밋 히스토리 + diff를 분석해서 PR 설명을 **자동 생성**한다.

```markdown
### 왜(Why)

[커밋 메시지들에서 추출한 변경 이유 — 기능 단위로 요약]

### 변경사항(What)

- [기능 단위 변경 요약 1]
- [기능 단위 변경 요약 2]
- ...

### 링크

- [ISH-XXXX](https://linear.app/ishopcare/issue/ISH-XXXX)
```

**규칙:**
- 파일 목록 나열 금지 → 기능 단위로 요약
- 한국어
- 코드 스니펫 금지
- Claude attribution 금지

### 기존 PR 업데이트

`gh pr view`에서 가져온 기존 body를 **유지**하고, 새 커밋에서 추출한 변경사항만 추가한다.

**새 커밋 범위 파악:**
```bash
# 기존 PR의 마지막 커밋 이후 추가된 커밋만
git log origin/$(git branch --show-current)@{1}..HEAD --oneline
```

위 명령이 실패하면 (reflog 없는 경우):
```bash
# fallback: 전체 커밋 분석 후 기존 body에 없는 내용만 추가
git log ${BASE}..HEAD --oneline
```

**기존 body의 "변경사항(What)" 섹션 끝에 새 항목 추가:**
```markdown
### 변경사항(What)

- 기존 항목 1
- 기존 항목 2
- 새로 추가된 변경 1
- 새로 추가된 변경 2
```

**Why, 링크 섹션은 수정하지 않는다.** 이유가 변경되었으면 전체를 다시 작성한다.

## Step 5. PR 생성/업데이트 실행

**신규:**
```bash
gh pr create --title "[ISH-XXXX] type(scope): 간결한 제목" \
  --body "$(cat <<'EOF'
PR 설명 내용
EOF
)"
```

**업데이트:**
```bash
gh pr edit [PR_NUMBER] --body "$(cat <<'EOF'
갱신된 PR 설명 내용
EOF
)"
```

**타이틀 규칙:**
- 이슈 키 + 타입 + 간결한 설명
- 70자 이내
- 한국어

## Step 6. 결과 출력

```
완료:
- Branch: [브랜치명]
- PR: [PR_URL] (신규 생성 / 업데이트)
- 이슈: [이슈 URL] (있으면)
```

## 원칙

- 논스톱 실행 — 중간에 질문하지 않는다
- main/master 브랜치면 즉시 중단
- Claude attribution 절대 금지
- PR 설명은 기능 단위 요약 (파일 나열 X, 코드 스니펫 X)
- 기존 PR 업데이트 시 기존 내용 유지 + 신규만 추가
