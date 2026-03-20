---
title: convention-checker Agent
date: 2026-03-20
status: draft
---

# convention-checker Agent

## 목적

code-writer가 작성한 코드를 conventions 전체 기준으로 검증하고, 위반 시 구체적 수정 지시를 출력한다.
code-writer의 자기검증(같은 편향) 한계를 보완하는 **독립된 검증자**.

## 기존 검증과의 차이

| | harness | convention-checker | code-reviewer |
|---|---|---|---|
| 시점 | 매 Edit/Write | Phase 완료 후 | /fe:review 호출 시 |
| 커버리지 | 9개 (grep) | 50개+ (conventions 전체) | 50개+ (conventions 전체) |
| 출력 | ❌ stderr | 수정 지시 (code-writer용) | 리뷰 보고서 (사람용) |
| 비용 | 0 | Agent 1회 | Agent 1회 |
| 자동 수정 | AI가 즉시 | 루프로 writer 재호출 | 수동 |

## Agent 정의

```yaml
name: convention-checker
description: Phase 완료 후 변경 파일의 컨벤션 위반을 검증하고 구체적 수정 지시를 출력한다.
model: sonnet
disallowedTools: Write, Edit, Bash, NotebookEdit
references:
  - conventions/code-principles.md
  - conventions/folder-structure.md
  - conventions/api-layer.md
  - conventions/coding-style.md
```

### 모델: sonnet

- 코드를 수정하지 않고 읽기만 함 → opus 불필요
- 위반 판단은 conventions에 명시된 규칙 대조 → sonnet으로 충분
- 루프에서 반복 호출될 수 있으므로 비용 효율 중요

## 프로토콜

### 입력

오케스트레이터(implement command)가 전달:

```
변경된 파일 목록:
- {절대 경로 1}
- {절대 경로 2}
- ...

Phase 컨텍스트:
- Phase {N}: {제목}
- 구현 내용 요약
```

### Step 1. 변경 파일 읽기

- 전달받은 파일을 전부 Read
- 파일 내용 + 파일 경로(폴더 위치) 모두 확인

### Step 2. 컨벤션 대조

references로 로드된 5개 conventions 기준으로 위반 검사.

**체크 영역:**

| 컨벤션 | 주요 체크 포인트 |
|--------|----------------|
| code-principles | SSOT 위반, SRP 위반, A-B-A-B 분산, 분리≠추상화, 인지부하 초과 |
| folder-structure | 파일 위치 (Page First, 지역성), 접미사 규칙, models vs types |
| api-layer | *Params 타입, queryOptions 패턴, mutateAsync+try-catch, DTO 구조 |
| coding-style | useEffect 기명함수, handler 네이밍, Boolean Props, overlay.open |

**체크하지 않는 것:**
- harness가 이미 잡는 기계적 규칙 (enum, any, console.log 등) → 중복 체크해도 무방하지만 우선순위 낮음
- 비즈니스 로직 정확성 → checker의 범위 아님
- 디자인/UX 적절성 → checker의 범위 아님

### Step 3. 출력

**위반 없을 때:**
```
✅ 컨벤션 검증 통과 — 위반 없음
```

**위반 있을 때:**
```
🔴 컨벤션 위반 {N}건

위반 1:
  파일: {절대 경로}:{라인}
  규칙: {컨벤션 파일명} > {섹션명}
  문제: {구체적 설명}
  수정: {어떻게 고쳐야 하는지 구체적 지시}

위반 2:
  파일: {절대 경로}:{라인}
  규칙: ...
  문제: ...
  수정: ...
```

**출력 규칙:**
- 모든 위반에 `수정:` 필수 — code-writer가 읽고 바로 수정할 수 있어야 함
- 수정 지시가 모호하면 포함하지 않음 (확실한 것만)
- 코드 블록으로 Before/After 제시 권장
- 중요도 순 정렬 (구조 > 로직 > 스타일)

## implement command 통합

### 현재 흐름
```
Phase N → code-writer Agent → 결과 보고 → 사용자 확인
```

### 변경 흐름
```
Phase N → code-writer Agent → convention-checker Agent
  ↓
위반 0건 → 결과 보고 → 사용자 확인
  ↓
위반 N건 → code-writer에게 수정 지시 전달 → 재구현
  → convention-checker 재체크 (2회차)
  → 위반 0건 → 결과 보고 → 사용자 확인
  → 위반 N건 → 위반 목록 포함하여 결과 보고 → 사용자 판단
```

### 오케스트레이터 로직 (implement command)

```
1. code-writer Agent 호출 (Phase N 구현)
2. 변경된 파일 목록 수집 (git diff --name-only 또는 Agent 결과에서 추출)
3. convention-checker Agent 호출 (변경 파일 전달)
4. 결과 판단:
   - "✅ 통과" → 사용자에게 Phase 결과 보고
   - "🔴 위반 N건" → loop_count < 2이면:
     a. checker 출력을 code-writer에게 전달: "아래 위반을 수정해라"
     b. code-writer 재실행
     c. convention-checker 재실행
     d. loop_count++
   - loop_count >= 2이면 → 위반 목록 포함하여 사용자에게 보고
```

### code-writer 재호출 프롬프트

```
이전 Phase {N} 구현에서 컨벤션 위반이 발견되었다. 아래 위반만 수정해라.
다른 코드는 건드리지 마라.

{convention-checker 출력 그대로}
```

## 구현 순서

1. `agents/convention-checker.md` 작성
2. `commands/implement.md` 수정 — checker 루프 통합
3. 테스트 — 실제 구현 Phase에서 checker 동작 확인
4. plugin.json 버전 업

## 열린 질문

- [ ] Phase 없이 전체 위임(Phase 2B)할 때도 checker 실행할 것인가?
- [ ] /fe:refactor 완료 후에도 checker 실행할 것인가?
- [ ] checker가 발견한 위반을 cc-monitor에 로깅할 것인가?
