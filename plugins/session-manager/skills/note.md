---
name: note
description: Use when the user asks to save, organize, or record knowledge from the current session — triggered by phrases like "정리해줘", "남겨둬", "노트로 만들어줘", "기록해줘", "패턴으로 저장해줘"
---

사용자가 세션 대화 중 정리/저장을 자연어로 요청할 때 트리거된다.

## 트리거 표현

- "정리해줘", "이거 정리해줘"
- "남겨둬", "이거 남겨둬"
- "노트로 만들어줘"
- "기록해줘"
- "패턴으로 저장해줘"

## 동작

`/note` 커맨드와 동일한 로직을 수행한다.

1. 정리 대상 파악
2. 저장 위치 자동 판단 + 사용자 확인
3. 기존 문서 확인 (있으면 업데이트)
4. 저장

상세 동작은 `/note` 커맨드 참조.
