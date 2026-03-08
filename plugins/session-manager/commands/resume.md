---
description: 작업 컨텍스트 복원 — .ai/active/ 에서 작업 선택 후 로드
allowed-tools: Read, Glob, Edit, AskUserQuestion
argument-hint: [작업 파일명 (선택)]
---

SessionStart hook이 작동하지 않았을 때 수동으로 작업 컨텍스트를 복원한다.

$ARGUMENTS

## 동작

1. `.ai/active/` 폴더 확인
2. 파일이 없으면 → "활성 작업 없음. /save로 작업 컨텍스트를 저장하세요." 출력
3. 인자로 파일명이 주어지면 → `.ai/active/{파일명}.md` 바로 로드
4. 파일이 1개면 → 바로 로드
5. 파일이 여러 개면 → AskUserQuestion으로 작업 선택
6. 선택된 파일 내용 전체 출력
7. **session_id 등록**: 현재 세션의 session_id를 active 파일의 `## 세션 이력` 섹션에 추가. session_id는 Bash로 `echo $CLAUDE_SESSION_ID`를 실행하여 획득. 값이 없으면 이 단계 스킵. 섹션이 없으면 파일 끝에 생성. 이미 등록된 session_id는 스킵.
   - 형식: `- {session_id} ({YYYY-MM-DD HH:mm})`
8. **다음 작업 표시**: 작업 체크리스트에서 미완료(`- [ ]`) 첫 번째 항목을 "다음 작업"으로 강조 표시
9. "이어서 뭘 할까요?" 질문

## 출력 예시

```
## 현재 작업: 청약 리스트 페이지

(파일 내용)

---
**다음 작업:** API 연결
이어서 뭘 할까요?
```
