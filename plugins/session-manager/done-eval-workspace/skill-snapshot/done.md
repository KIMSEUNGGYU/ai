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
  ---

## 2. 자가학습 (필수 — 스킵 시 반드시 사유 출력)

### 2-A. Transcript 기반 학습 (교정 추출)

항상 실행. transcript 결정 우선순위:

1. active 파일의 `## 세션 이력` session_id → 해당 transcript
2. 세션 이력 없으면 → `ls -t ~/.claude/projects/{project-hash}/*.jsonl | head -1` (현재 세션)

**2-A-1.** transcript 전처리:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/extract-corrections.mjs" {transcript_path1} [{transcript_path2} ...]
```

`{project-hash}`: cwd를 `-`로 변환. 출력: `{ messages, stats: { correctionHits, positiveHits, extracted } }`

**2-A-2.** `(correctionHits === 0 && positiveHits === 0)` 또는 `extracted < 3`이면 스킵.

**2-A-3.** Agent로 서브에이전트 실행. 프롬프트에 messages를 넘기고, 분류 기준([교정/신규/위반/선호])과 카테고리(code→learnings-code.md, thinking→learnings-thinking.md, workflow→learnings-workflow.md, domain→learnings-domain.md, meta→learnings-meta.md)로 JSON 배열 출력 요청. 교정 없으면 빈 배열.

**2-A-4.** 결과 있으면 AskUserQuestion으로 제안 → 전체/번호선택/스킵

**2-A-5.** 승인 항목을 `~/.claude/rules/learnings-{category}.md`에 추가. 형식: `- {rule} <!-- learned: {날짜}, task: {작업명} -->`. 중복 금지.

### 2-B. Active 파일 기반 학습 (결정사항/컨벤션 추출)

active 파일이 있을 때 실행. **"이렇게 해라" 패턴을 학습하는 트랙.**

**2-B-1.** active 파일에서 다음 섹션을 파싱:
- `## 결정사항` — 구현 중 내린 기술 판단과 근거
- `## 컨벤션 변경` — 프로젝트 규칙의 변경/추가
- `## 스펙 변경` — 구현 중 스펙이 달라진 부분과 사유

**2-B-2.** 섹션이 없거나 비어있으면 스킵.

**2-B-3.** Agent로 서브에이전트 실행. 프롬프트:
- 입력: 파싱된 결정사항/컨벤션 변경/스펙 변경 항목들
- 기존 learnings 파일들 (Read로 읽기: learnings-code.md, learnings-domain.md, learnings-workflow.md)
- 지시:
  - 각 항목을 learnings 카테고리로 분류 (code/domain/workflow)
  - 기존 learnings와 중복 체크 — 이미 있는 규칙이면 제외
  - 프로젝트 특정적인 것(서버 상태값 등)은 domain, 코드 패턴은 code, 작업 방식은 workflow
  - 일회성 결정(PR 범위 최소화 등)은 제외 — 반복 적용 가능한 것만
- 출력: JSON 배열 `[{ rule: string, category: string, source: "결정사항"|"컨벤션"|"스펙변경" }]`
- 빈 배열 가능

**2-B-4.** 결과 있으면 AskUserQuestion으로 제안:
- "active 파일에서 다음 학습 항목을 발견했습니다. 반영할까요?"
- 전체/번호선택/스킵

**2-B-5.** 승인 항목을 `~/.claude/rules/learnings-{category}.md`에 추가. 형식: `- {rule} <!-- learned: {날짜}, task: {작업명} -->`. 중복 금지.

### 2-C. Profile 학습 (판단 패턴)

**2-C-1.** `decisionTurns`가 비어있으면 스킵. 있으면 Agent로 서브에이전트 실행.

프롬프트:
- 입력: decisionTurns (AI 제안 + 사용자 선택 짝)
- 기존 profile.md 내용 (Read로 읽기)
- 지시: 각 턴에서 "상황 → 판단 → 이유 → 원칙" 추출
- 출력: JSON 배열 `[{ principle: string, pattern: string, isNew: boolean }]`
  - `isNew: true` → 기존 원칙에 없는 새 원칙 (패턴 3개 이상 뒷받침 시만)
  - `isNew: false` → 기존 원칙 강화 패턴
- 보수적 갱신 규칙:
  - 기존 원칙과 충돌 → 패턴만 추가
  - 원칙 총 15개 상한 → 넘으면 유사 원칙 병합 제안
  - 피상적 규칙 금지 ("사용자가 A를 선택했다" X → "관리 포인트 최소화를 우선한다" O)
- 빈 배열 가능 (학습할 게 없으면)

**2-C-2.** profile 결과 있으면 AskUserQuestion으로 제안 → 전체/번호선택/스킵

**2-C-3.** 승인 항목을 `~/.claude/rules/profile.md`에 반영.
- `isNew: false` → 해당 원칙의 `## 근거 패턴` 하위에 패턴 추가. 형식: `- {pattern} <!-- pattern: {날짜}, task: {작업명} -->`
- `isNew: true` → `## 핵심 원칙`에 원칙 추가 + `## 근거 패턴`에 새 섹션 생성
- 50줄 상한 초과 시 → 오래된 패턴(날짜 기준)부터 제거

## 3. 패턴 질문

페이지 구현, 공통 UI 조합, 새 도메인 API, 새 상태관리일 때만 `.ai/patterns/` 저장 제안. 버그 수정/단순 변경은 스킵.

## 4. CHANGELOG 기록 + active 정리 + INDEX 업데이트

`.ai/CHANGELOG.md`에 완료 기록 추가. 날짜 섹션(`## YYYY-MM-DD`)이 없으면 새로 생성.

**형식:**
```markdown
- {작업 제목} — {한 줄 요약} ✅
  - 세션: {full_session_id} ({날짜}), ...
  - 완료: {active 파일의 [x] 항목을 한 줄로 요약}
  - 자가학습: {N}건 반영 ({카테고리들}) / 스킵({사유}) / 교정 없음
```

- **세션**: active 파일의 `## 세션 이력`에서 추출. 현재 세션도 포함. session_id 전체 기록.
- **완료**: active 파일의 `## 작업` 체크리스트에서 `[x]` 항목을 요약. 3개 이하면 그대로, 4개 이상이면 핵심만 압축.
- **자가학습**: Step 2 결과 요약. 카테고리는 반영된 것만 표기 (예: code, workflow). Transcript(2-A)과 Active(2-B)에서 반영된 건수를 합산.
- active 파일 0개면 세션/완료 행 생략, 현재 대화 맥락에서 요약.

active 파일 있으면 삭제, `.ai/INDEX.md` 진행 중 섹션에서 링크 제거.

## 출력

```
작업 완료: {제목}
→ 자가학습(transcript): {N}건 반영 / 스킵({사유}) / 교정 없음
→ 자가학습(active): {N}건 반영 / 스킵({사유}) / 결정사항 없음
→ 프로파일: {N}건 반영 / 스킵({사유}) / 의사결정 턴 없음
→ 패턴 저장: {경로} / 없음
→ CHANGELOG: 세션 {N}개 기록
→ active: 삭제 완료 / 없음
```
