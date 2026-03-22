---
description: 작업 완료 처리 — 자가학습 + 패턴 질문 + CHANGELOG 기록 + active 정리
allowed-tools: Read, Write, Edit, Glob, Bash, Agent, AskUserQuestion
argument-hint: [작업 파일명 (선택)]
---

작업 완료 시 호출. $ARGUMENTS

## 1. active 파일 확인

- 인자 있으면 `.ai/active/{파일명}.md` 사용
- 없으면 자동 선택 (1개→바로, 여러개→AskUserQuestion)
- active 파일 0개여도 **종료하지 않고** Step 2로 진행

## 2. 자가학습 (필수 — 스킵 시 반드시 사유 출력)

### 2-A. Transcript 기반 학습 (판단 패턴 추출)

항상 실행. transcript 결정 우선순위:

1. active 파일의 `## 세션 이력` session_id → 해당 transcript
2. 세션 이력 없으면 → `ls -t ~/.claude/projects/{project-hash}/*.jsonl | head -1` (현재 세션)

**2-A-1.** transcript 전처리:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/extract-corrections.mjs" {transcript_path1} [{transcript_path2} ...]
```

`{project-hash}`: cwd를 `-`로 변환. 출력: `{ messages, decisionTurns, stats }`

**2-A-2.** `extracted < 3`이면 스킵.

**2-A-3.** Agent로 서브에이전트 실행. 프롬프트에 messages(전체 대화)를 넘기고:

**추출 대상 2가지:**

**(1) 판단 기록** — 대화에서 의사결정이 발생한 순간을 찾아 기록.
감지 기준:
- 사용자가 선택지 중 하나를 고른 순간
- AI 제안을 거부/교정한 순간
- 방향을 전환한 순간

각 판단 기록의 형식:
```json
{
  "type": "decision",
  "title": "판단 제목",
  "context": "무엇을 하려다 어떤 갈림길을 만났는지",
  "options": "A — ... | B — ...",
  "decision": "선택한 것",
  "rejected_reason": "왜 다른 선택지를 안 했는지 (핵심)",
  "generalization": "반복 가능 / 일회성 + 적용 패턴"
}
```
품질 기준:
- "XXX를 했다"는 판단이 아니다. "A vs B에서 A를 골랐다"가 판단.
- 사소한 결정(파일명, 변수명 등)은 제외. 아키텍처, 방향, 설계 수준만.
- rejected_reason이 없으면 판단 기록으로서 가치 없다.

**(2) conventions 후보** — AI가 같은 실수를 반복하여 교정된 경우.
```json
{
  "type": "convention",
  "title": "규칙 제목",
  "content": "항상 적용되는 규칙 2~3줄 + 이유"
}
```

교정/판단 없으면 빈 배열.

**2-A-4.** 결과 저장:

**(1) 판단 기록:**
- cwd 기반 프로젝트 매핑 (session-start.mjs의 PROJECT_MAP 참조)
- `~/hq/10_projects/{project}/decisions.md`에 추가:
```markdown
## {title}
- 맥락: {context}
- 선택지: {options}
- 결정: {decision}
- 버린 이유: {rejected_reason}
- 일반화: {generalization}
({날짜})
```
- 서비스 하위 폴더가 매칭되면 해당 서비스에 저장

**(2) conventions 후보:**
- 기존 `~/.claude/rules/conventions.md`를 Read로 읽기
- 이미 비슷한 내용 있으면 → 제외
- 기존 패턴과 **모순** → AskUserQuestion으로 확인
- 모순 아닌 항목은 conventions.md에 자동 저장

중복 금지.

### 2-B. Active 파일 기반 학습 (결정사항/컨벤션 추출)

active 파일이 있을 때 실행.

**2-B-1.** active 파일에서 다음 섹션을 파싱:
- `## 결정사항` — 구현 중 내린 기술 판단과 근거
- `## 컨벤션 변경` — 프로젝트 규칙의 변경/추가
- `## 스펙 변경` — 구현 중 스펙이 달라진 부분과 사유

**2-B-2.** 섹션이 없거나 비어있으면 스킵.

**2-B-3.** Agent로 서브에이전트 실행. 프롬프트:
- 입력: 파싱된 결정사항/컨벤션 변경/스펙 변경 항목들
- 기존 rules 파일들 (Read로 읽기: decisions.md, conventions.md, system.md)
- 지시:
  - 분류 기준: decisions(맥락 의존적 판단) / conventions(맥락 무관 규칙) / system(운영 방법)
  - 기존 rules와 중복 체크 — 이미 있는 규칙이면 제외
  - 일회성 결정은 제외 — 반복 적용 가능한 것만
- 출력: JSON 배열 `[{ title: string, content: string, category: string }]`
- 빈 배열 가능

**2-B-4.** 결과 있으면 **자동 저장**. 기존 패턴과 모순 시만 AskUserQuestion.

### 2-C. 암묵적 선호 포착

**2-C-1.** 세션에서 사용자가 명시적 거부/이유 설명 없이 일관되게 보인 행동 패턴을 관찰.
예: 특정 네이밍 스타일, 파일 구조 선호, 특정 라이브러리 선호 등.

**2-C-2.** 관찰된 패턴이 있으면 AskUserQuestion으로 **질문 형태**로 확인:
```
"이번 세션에서 {관찰 내용}인데, 이게 의도적인 패턴인가요?"
```

**2-C-3.** 사용자 응답:
- 긍정 → 해당 카테고리 파일에 저장
- 부정 → 버림
- 무응답/무시 → 다음 세션에서 같은 패턴 보이면 한 번 더 (최대 2회)

### 2-D. identity 변화 감지 (반자동)

**2-D-1.** 세션에서 사용자의 가치관/일하는 방식에 변화가 감지되면 제안.
예: 기존에 "심플 우선"이었는데 이번에 복잡한 설계를 선호한 경우.

**2-D-2.** AskUserQuestion으로 확인 → 사용자 승인 시만 `~/.claude/rules/identity.md` 반영.

## 3. 세컨드 브레인 축적 (hq/10_projects/)

cwd 기반으로 프로젝트를 판단하고, 해당 프로젝트의 hq 파일에 지식을 축적한다.

**프로젝트 매핑 (session-start.mjs의 PROJECT_MAP과 동일):**
- `~/work/ishopcare-frontend/services/admin` → `ishopcare/admin`
- `~/work/ishopcare-frontend/services/partners` → `ishopcare/partners`
- `~/work/ishopcare-frontend` → `ishopcare`
- `~/work/ishopcare-retool-server` → `ishopcare-server`
- `~/dev/ai` → `ai`

**3-1. 작업 로그 (log.md) — 항상 실행**

`~/hq/10_projects/{project}/log.md` 최상단(frontmatter 다음)에 append:
```markdown
- [YYYY-MM-DD] {작업 한 줄 요약}
```
active 파일의 `## 작업` 체크리스트에서 `[x]` 항목을 요약하거나, 현재 세션 대화에서 추출.

**3-2. 기술 결정 (decisions.md) — 해당 시 실행**

세션에서 기술 결정이 있었으면 `~/hq/10_projects/{project}/decisions.md`에 추가:
```markdown
## {결정 제목}
{내용 + 근거 2~3줄}. ({날짜})
```
판단 기준: "왜 이 방식을 선택했는지"가 있는 것. 단순 구현은 제외.

**3-3. 비즈니스 정책 (policies.md) — 해당 시 실행**

세션에서 새로운 비즈니스 규칙/정책을 알게 됐으면 `~/hq/10_projects/{project}/policies.md`에 추가.
판단 기준: 코드가 아닌 비즈니스 로직. 상태 머신, 조건 분기, 예외 케이스 등.

**3-4. 도메인 컨텍스트 (context.md) — 드물게 실행**

새로운 도메인 개념이나 아키텍처 변경이 있었을 때만 `~/hq/10_projects/{project}/context.md` 업데이트 제안.
자동 저장하지 않고 AskUserQuestion으로 확인 후 반영.

**서비스 하위 폴더가 있으면 해당 서비스에 저장** (예: admin 작업이면 `ishopcare/admin/`에).

## 4. 패턴 질문

페이지 구현, 공통 UI 조합, 새 도메인 API, 새 상태관리일 때만 `.ai/patterns/` 저장 제안. 버그 수정/단순 변경은 스킵.

## 5. CHANGELOG 기록 + active 정리 + INDEX 업데이트

`.ai/CHANGELOG.md`에 완료 기록 추가. 날짜 섹션(`## YYYY-MM-DD`)이 없으면 새로 생성.

**형식:**
```markdown
- {작업 제목} — {한 줄 요약} ✅
  - 세션: {full_session_id} ({날짜}), ...
  - 완료: {active 파일의 [x] 항목을 한 줄로 요약}
  - 자가학습: {N}건 반영 ({카테고리들}) / 스킵({사유}) / 추출 없음
```

- **세션**: active 파일의 `## 세션 이력`에서 추출. 현재 세션도 포함.
- **완료**: active 파일의 `## 작업` 체크리스트에서 `[x]` 항목을 요약.
- **자가학습**: Step 2 결과 요약. 카테고리는 반영된 것만 표기 (예: decisions, conventions).
- active 파일 0개면 세션/완료 행 생략, 현재 대화 맥락에서 요약.

active 파일 있으면 `.ai/archive/{YYYY-MM-DD}-{파일명}` 으로 이동 (삭제하지 않음), `.ai/INDEX.md` 진행 중 섹션에서 링크 제거.

## 출력

```
작업 완료: {제목}
→ 자가학습(transcript): {N}건 반영 ({카테고리들}) / 스킵({사유}) / 추출 없음
→ 자가학습(active): {N}건 반영 / 스킵({사유}) / 결정사항 없음
→ 암묵적 선호: {N}건 질문 / 관찰 없음
→ identity: 변화 감지 → 제안 / 변화 없음
→ 세컨드 브레인: {project} — log {N}건, decisions {N}건, policies {N}건 / 매칭 없음
→ 패턴 저장: {경로} / 없음
→ CHANGELOG: 세션 {N}개 기록
→ active: archive 이동 완료 (.ai/archive/{날짜}-{파일명}) / 없음
```
