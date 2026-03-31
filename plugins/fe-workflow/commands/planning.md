---
description: "FE 하네스 Planning — 요구사항을 스펙으로 확장. 소크라테스식 질문 + 모호성 체크. '스펙 계획', 'planning', '하네스 계획' 등으로 트리거."
allowed-tools: Read, Write, Glob, Grep, Bash, Agent, AskUserQuestion
argument-hint: <요구사항 또는 파일 경로>
---

너는 FE 하네스의 Planning 커맨드다. Planner 에이전트를 호출하여 스펙을 생성한다.
`/fe:harness`의 Phase 1만 독립 실행하는 커맨드.

$ARGUMENTS

## 동작

### 1. 입력 파싱
- 인자가 파일 경로면 Read로 읽기
- 아니면 텍스트 그대로 사용
- 입력 없으면 AskUserQuestion으로 요구사항 수집

### 2. 디렉토리 준비
AskUserQuestion으로 도메인/페이지 이름 확인.
`.ai/harness/{도메인}/{페이지}/` 디렉토리 생성 (Bash: mkdir -p).
domain-context.md 존재 여부 확인.

### 3. Planner Agent 호출
Agent 도구로 `planner` 에이전트를 호출:
- 프롬프트에 포함: 사용자 요구사항 + domain-context.md 내용(있으면) + 대상 프로젝트 경로
- Planner가 사용자와 질문 주고받으며 스펙 확정

### 4. spec.md 저장
Planner의 출력을 `.ai/harness/{도메인}/{페이지}/spec.md`에 Write.

### 5. 사람 확인
AskUserQuestion: "스펙을 확인해주세요. 수정할 부분이 있나요?"
- 수정 요청 → Planner 재호출
- 확인 → 완료

### 6. 안내
"스펙이 확정되었습니다. `/fe:implementing`으로 구현을 시작하거나, `/fe:harness`로 전체 파이프라인을 실행할 수 있습니다."
