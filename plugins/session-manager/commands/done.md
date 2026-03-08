---
description: 작업 완료 처리 — 자가학습 + 패턴 질문 + active 정리 + INDEX 업데이트
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

항상 실행. transcript 결정 우선순위:

1. active 파일의 `## 세션 이력` session_id → 해당 transcript
2. 세션 이력 없으면 → `ls -t ~/.claude/projects/{project-hash}/*.jsonl | head -1` (현재 세션)

**2-1.** transcript 전처리:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/extract-corrections.mjs" {transcript_path1} [{transcript_path2} ...]
```

`{project-hash}`: cwd를 `-`로 변환. 출력: `{ messages, stats: { correctionHits, positiveHits, extracted } }`

**2-2.** `(correctionHits === 0 && positiveHits === 0)` 또는 `extracted < 3`이면 스킵.

**2-3.** Agent로 서브에이전트 실행. 프롬프트에 messages를 넘기고, 분류 기준([교정/신규/위반/선호])과 카테고리(code→learnings-code.md, thinking→learnings-thinking.md, workflow→learnings-workflow.md, domain→learnings-domain.md, meta→learnings-meta.md)로 JSON 배열 출력 요청. 교정 없으면 빈 배열.

**2-4.** 결과 있으면 AskUserQuestion으로 제안 → 전체/번호선택/스킵

**2-5.** 승인 항목을 `~/.claude/rules/learnings-{category}.md`에 추가. 형식: `- {rule} <!-- learned: {날짜}, task: {작업명} -->`. 중복 금지.

## 3. 패턴 질문

페이지 구현, 공통 UI 조합, 새 도메인 API, 새 상태관리일 때만 `.ai/patterns/` 저장 제안. 버그 수정/단순 변경은 스킵.

## 4. active 정리 + INDEX 업데이트

active 파일 있으면 삭제, `.ai/INDEX.md` 진행 중 섹션에서 링크 제거.

## 출력

```
작업 완료: {제목}
→ 자가학습: {N}건 반영 / 스킵({사유}) / 교정 없음
  스킵 사유: "correctionHits=0", "extracted<3", "사용자 스킵"
→ 패턴 저장: {경로} / 없음
→ active: 삭제 완료 / 없음
```

