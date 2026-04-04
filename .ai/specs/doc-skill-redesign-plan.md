# /doc 스킬 재설계 구현 계획

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** /doc 스킬을 재설계하여 대화 내용 기반 자동 유형 판별 + 작성 원칙 적용 문서 생성

**Architecture:** session-manager 플러그인의 skills/doc.md를 전면 재작성. commands/doc.md 트리거 업데이트. /note는 /doc으로 흡수 후 제거.

**Tech Stack:** Claude Code plugin skill (.md)

---

### Task 1: skills/doc.md 전면 재작성

**Files:**
- Rewrite: `plugins/session-manager/skills/doc.md`

스펙(`.ai/specs/doc-skill-redesign.md`) 기반으로 새로 작성. 기존 파일 내용은 참고만.

- [ ] **Step 1: skills/doc.md 전면 재작성**

```markdown
---
name: doc
description: 대화 내용을 분석해서 적절한 유형과 구조로 문서를 자동 작성. "정리해줘", "정리해", "해당 내용 정리해줘", "문서로 만들어줘" 등으로 트리거. 기존 /note 기능 포함.
---

대화 내용을 분석하여 적절한 유형을 판별하고, 작성 원칙에 따라 구조화된 문서를 작성한다.

## 실행 흐름

### 1단계: 대화 내용 분석

현재 세션 대화를 분석한다:
- 어떤 주제인가
- 어떤 결정/고민/해결이 있었는가
- 외부 자료(슬랙, 노션, 웹 등)가 언급되었는가

외부 자료가 있으면 적절한 도구로 읽는다:

| 소스 | 도구 |
|------|------|
| Slack 스레드 | slack_read_thread |
| Notion 페이지 | notion-fetch |
| Linear 이슈 | get_issue |
| 웹 페이지 | WebFetch |
| 로컬 파일 | Read |

### 2단계: 유형 판별 + 저장 위치 제안

대화 내용을 분석해서 아래 4유형 중 자동 선택.
판별 결과와 저장 위치를 한 줄로 알려주고 사용자 확인을 받는다.
판별이 애매하면 사용자에게 질문한다.

"project-journal로 ~/hq/10_projects/ishopcare/에 저장합니다"

| 유형 | 판별 기준 |
|------|----------|
| project-journal | 구현 과정 + 의사결정이 있는 작업 |
| troubleshooting | 에러/버그 해결 과정 |
| decision | 선택지 비교 + 결정 (구현 없이 결정만) |
| guide | 설정/구축 절차 (에러 아닌 처음부터 세팅) |

### 3단계: 사용자 확인

사용자가 유형, 저장 위치를 조정할 수 있다. 확인 후 작성 진행.

### 4단계: 문서 작성

해당 유형 구조 + 작성 원칙을 적용하여 문서를 작성한다.

#### frontmatter

모든 문서에 포함:

---
tags:
  - {도메인 태그}
  - {기술 태그}
date: YYYY-MM-DD
type: project-journal | troubleshooting | decision | guide
---

- tags: 핵심 키워드 2~4개
- date: 오늘 날짜
- type: 판별된 유형

#### 유형별 구조

**project-journal** — 구현 과정 + 의사결정 기록

# {제목}

## 배경
- 왜 이 작업이 필요했는가 (비즈니스 맥락)

## 최종 구조
- 완성된 아키텍처/설계 (코드, 다이어그램, 표 등)

## 핵심 구현
- 주요 코드/설정
- 다시 봤을 때 맥락을 복원할 수 있는 수준으로 포함

## 고민 포인트
### Q1. 한 줄 질문
**문제** — 뭐가 문제였는지
**검토한 방법** — 표로 비교 (방식/설명/장단점)
**결론** — 선택 + 근거


**troubleshooting** — 에러/버그 해결 과정

# {제목}

## 증상
- 어떤 에러/문제가 발생했는가

## 원인
- 왜 발생했는가 (근본 원인)

## 해결
- 구체적 조치 (코드/설정)

## 교훈
- 재발 방지 또는 알게 된 점


**decision** — 기술 결정 기록

# {제목}

## 배경
- 왜 이 결정이 필요했는가

## 선택지
| 방식 | 설명 | 장점 | 단점 |

## 결정
- 무엇을 선택했는가

## 근거
- 왜 이것을 선택했는가


**guide** — 설정/구축 절차

# {제목}

## 개요
- 무엇을, 왜 하는가

## 절차
1. 단계별 구체적 실행 방법

## 주의사항
- 빠지기 쉬운 함정, 전제 조건


### 5단계: 저장

저장 위치 규칙 (pc-map.md 기반):

| 내용 성격 | 저장 위치 | 예시 |
|----------|----------|------|
| 특정 프로젝트 작업 | 해당 프로젝트 .ai/notes/ | 하네스 구현 과정 |
| 프로젝트 축적 지식 | ~/hq/10_projects/{프로젝트}/ | ishopcare 도메인 정리 |
| 학습/기술 참고 | ~/hq/30_learn/ | React 패턴 |
| 시스템/환경설정 | ~/hq/40_system/ | Zscaler SSL |
| 분류 불명확 | 사용자에게 질문 | — |

기존 파일이 있는지 Glob으로 확인하고, 있으면 업데이트를 제안한다.

저장 후 결과 출력:
  문서: {제목}
  유형: {type}
  위치: {저장 경로}

## 작성 원칙 (모든 유형 공통)

### 구조 원칙
1. **최종 결과물 먼저** — 결론/완성된 구조를 앞에, 과정은 뒤에
2. **한 문서 한 주제** — 여러 주제가 섞이면 분리
3. **예측 가능한 구성** — 유형별 정해진 구조를 따름

### 깊이 원칙
4. **"왜?" 필수** — 모든 결정/선택에 근거 포함. 표면적 서술 금지
5. **고민 과정 누락 금지** — 대화에서 나온 검토 내용, 기각된 대안도 기록
6. **비교표 활용** — 선택지가 2개 이상이면 표로 정리
7. **맥락 복원 가능한 깊이** — 코드는 줄이되, 다시 봤을 때 "왜 이렇게 했지?"가 남으면 안 됨

### 문장 원칙
8. **구체적으로** — "여러 가지 방법" → 구체적 방법명 나열
9. **주체 분명히** — "처리된다" → "Next.js가 처리한다"
10. **불필요한 정보 제거** — 자명한 설명 생략

## 추가 규칙

- 대화 원문을 그대로 복붙하지 않는다 — 핵심을 추출하여 구조화
- 코드는 핵심 부분만 포함, 전체 복붙 금지
- 외부 자료 source가 있으면 문서 말미에 출처 기록
```

- [ ] **Step 2: 작성한 파일을 다시 읽어서 마크다운 문법 오류 확인**

---

### Task 2: commands/doc.md 업데이트

**Files:**
- Modify: `plugins/session-manager/commands/doc.md`

- [ ] **Step 1: commands/doc.md의 description과 트리거 업데이트**

```markdown
---
description: 대화 내용을 분석해서 적절한 유형과 구조로 문서를 자동 작성
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion, WebFetch, WebSearch, mcp__claude_ai_Slack__slack_read_thread, mcp__claude_ai_Slack__slack_read_channel, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Linear__get_issue
argument-hint: [정리할 내용이나 참고 URL (선택)]
---

`/doc` 스킬의 동작을 수행한다. skills/doc.md를 읽고 그 지시를 따른다.
```

---

### Task 3: /note 스킬 제거

**Files:**
- Delete: `plugins/session-manager/skills/note.md`
- Delete: `plugins/session-manager/commands/note.md`

- [ ] **Step 1: note.md 파일 2개 삭제**

```bash
rm plugins/session-manager/skills/note.md
rm plugins/session-manager/commands/note.md
```

---

### Task 4: plugin.json 버전 업데이트

**Files:**
- Modify: `plugins/session-manager/.claude-plugin/plugin.json`

- [ ] **Step 1: minor 버전 올리기 (skills 변경)**

```json
{
  "name": "session-manager",
  "description": "AI 페어 프로그래밍 context 관리 — 세션 간 맥락 유지 + 지식 영속 저장",
  "version": "0.27.0"
}
```

---

### Task 5: 커밋

- [ ] **Step 1: 변경사항 커밋**

```bash
git add plugins/session-manager/skills/doc.md plugins/session-manager/commands/doc.md plugins/session-manager/.claude-plugin/plugin.json
git add -u plugins/session-manager/skills/note.md plugins/session-manager/commands/note.md
git commit -m "feat: /doc 스킬 재설계 — 4유형 자동 판별 + 작성 원칙 통합, /note 흡수"
```
