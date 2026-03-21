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

**2-A-2.** `(correctionHits === 0 && positiveHits === 0)` 또는 `extracted < 3`이면 스킵.

**2-A-3.** Agent로 서브에이전트 실행. 프롬프트에 messages와 decisionTurns를 넘기고:

**추출 트리거:**
- 트리거 A (명시적 거부): 사용자가 AI 제안을 거부하고 다른 방향 선택
- 트리거 B (이유 설명): 사용자가 "~해서 ~하자" 등 판단 근거를 명시
- 트리거 C (선택지 결정): 사용자가 두 선택지 중 하나를 선택
- 트리거 D (반복 교정): AI가 같은 실수를 반복하여 교정됨

**분류 기준:**
- `decisions` — 상황에 따라 달라지는 판단 (맥락 의존적) → `~/.claude/rules/decisions.md`
- `conventions` — 항상 적용되는 규칙 (맥락 무관) → `~/.claude/rules/conventions.md`
- `system` — 시스템/도구 운영 방법 → `~/.claude/rules/system.md`

**출력 형식:**
```json
[{
  "title": "## 제목",
  "content": "판단 내용 + 이유 2~3줄 자연어. (근거)",
  "category": "decisions|conventions|system",
  "trigger": "A|B|C|D"
}]
```

교정 없으면 빈 배열.

**2-A-4.** 결과에 대해 **시뮬레이션 검증** 수행:
- 각 항목에 대해 구체적 시나리오를 만들어 테스트
- 통과 → 유지
- 실패 → 내용을 더 구체화하여 1회 재작성

**2-A-5.** 기존 rules 파일과 비교:
- 해당 카테고리 파일(decisions.md/conventions.md/system.md)을 Read로 읽기
- 이미 비슷한 내용 있으면 → 제외 또는 기존 항목 업데이트
- 기존 패턴과 **모순** → 사용자에게 AskUserQuestion으로 확인 ("이전엔 A였는데 이번엔 B, 어느 쪽?")

**2-A-6.** 모순이 아닌 항목은 **자동 저장**. 해당 카테고리 파일에 추가. 형식:
```markdown
## {title}
{content} ({날짜})
```
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
