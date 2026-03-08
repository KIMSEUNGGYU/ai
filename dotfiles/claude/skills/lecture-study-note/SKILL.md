---
name: lecture-study-note
description: 강의 기반 학습 노트 정리 범용 스킬
version: 2.0.0
trigger: /learn
argument_hint: "<강의ID> <섹션번호|주제> (예: db-basic 4, db-basic 서브쿼리)"
source: local-analysis
---

# 강의 학습 노트 정리

강의를 듣고 학습 내용을 옵시디언 노트에 체계적으로 정리하는 범용 워크플로우.

## 등록된 강의

| ID | 강의명 | 설정 파일 | 상태 |
|----|--------|-----------|------|
| db-basic | 김영한 실전 데이터베이스 기본편 | `courses/db-basic.md` | 진행 중 |

> 새 강의 추가 시 `courses/{id}.md` 에 설정 파일 생성
> 사용법: [usage.md](./usage.md)

## 사용법

```
/learn {강의ID} {섹션번호 또는 주제}
/learn db-basic 4          → 섹션 4 정리
/learn db-basic 서브쿼리    → 서브쿼리 주제 정리
/learn db-basic 정리 4      → 섹션 4 정리 노트(복습용) 생성
```

강의ID 생략 시 → 가장 최근 진행 중인 강의로 자동 선택

## 워크플로우

```
1. 강의 설정 파일에서 reference 경로, 커리큘럼 확인
   → ~/.claude/skills/lecture-study-note/courses/{강의ID}.md
2. 해당 섹션의 txt 파일 읽기 (reference 경로에서)
   → txt 없으면 pdftotext로 변환 후 읽기
3. 사용자가 추가로 공유하는 강의 내용/메모 반영
4. 상세 노트 작성 → 옵시디언 저장 경로
5. 정리 노트 작성 (복습용 요약)
6. 문제 풀이가 있으면 별도 노트 작성
```

## 노트 템플릿

### 상세 노트 (학습용)

파일명: `{섹션번호}-{순번} {주제명}.md`

```markdown
---
tags: [learn, {강의태그들}]
date: {YYYY-MM-DD}
source: {강의명}
section: {섹션번호}
---

# {섹션번호}-{순번}. {주제명}

## 왜 필요한가?

{이 개념이 왜 필요한지 동기 설명}

## 핵심 개념

{개념 설명}

## 문법/구문

{기본 문법 코드 블록}

## 실습

{실습 코드 + 결과 설명}

## 실무 팁

{강의에서 알려준 실무 팁}

## 정리

{핵심 포인트 3-5개 bullet}
```

### 정리 노트 (복습용)

파일명: `{섹션번호} {섹션명} 정리.md`

```markdown
---
tags: [learn, {강의태그들}, summary]
date: {YYYY-MM-DD}
source: {강의명}
section: {섹션번호}
---

# {섹션번호}. {섹션명} 정리

## {소주제 1}

{bullet 형태로 핵심만}

## {소주제 2}

{bullet 형태로 핵심만}
```

### 문제 풀이 노트

파일명: `{섹션번호} {주제명} 문제 풀이.md`

```markdown
---
tags: [learn, {강의태그들}, practice]
date: {YYYY-MM-DD}
source: {강의명}
section: {섹션번호}
---

# {섹션번호}. {주제명} 문제 풀이

## 문제 1

**요구사항**: {문제 설명}

{풀이 코드}

**핵심**: {이 문제에서 배운 점}
```

## 정리 스타일 규칙

1. **개념 → 문법 → 실습 → 팁 → 정리** 순서
2. **핵심 포인트**는 `>` blockquote로 강조
3. **코드 블록**에 주석으로 설명 추가
4. **비교 분석**은 표 형식 사용
5. **실행 순서** 같은 프로세스는 번호 리스트
6. **상세 노트**와 **정리 노트** 분리 (학습 vs 복습)
7. **Q&A 형식**으로 "왜?" 질문에 답하는 구조 활용

## PDF 변환 가이드

PDF가 너무 커서 Read tool로 직접 읽을 수 없는 경우:

```bash
# pdftotext 설치 (최초 1회)
brew install poppler

# 단일 파일 변환
pdftotext "{pdf경로}" "{txt경로}"

# 폴더 전체 변환
for pdf in "{pdf폴더}"/*.pdf; do
  filename=$(basename "$pdf" .pdf)
  pdftotext "$pdf" "{txt폴더}/${filename}.txt"
done
```

## 새 강의 추가 방법

`~/.claude/skills/lecture-study-note/courses/{강의ID}.md` 파일 생성:

```markdown
---
id: {강의ID}
name: {강의명}
status: 진행 중
---

# {강의명}

## 경로
- 노트 저장: /Users/gyu/obsidian-note/30_Resources/{폴더명}/
- 참고 자료(txt): {txt 경로}
- 참고 자료(pdf): {pdf 경로}
- 강의 링크: {URL}

## 태그
{강의별 태그 목록}

## 커리큘럼
| 섹션 | 주제 | 상태 |
|------|------|------|
| 1 | ... | 미정리 |
```
