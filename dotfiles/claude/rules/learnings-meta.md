# learnings-meta

- convention으로 해결 가능하면 메모리 사용 금지 <!-- learned: 2026-03-15, task: patterns-conventions 정리 -->
  - TRIGGER: 사용자가 선호/규칙을 알려줬을 때 저장 위치를 결정할 때
  - ACTION: 반복 적용 가능한 규칙은 conventions.md/decisions.md에 추가. 메모리는 맥락적·일시적 정보에만 사용

- rules 파일 저장 시 판단 근거(왜) 중심으로 작성 <!-- learned: 2026-03-19, task: view/edit 분리 패턴 -->
  - TRIGGER: 코드 패턴, 컨벤션, 판단을 conventions.md나 decisions.md에 저장할 때
  - ACTION: 코드 패턴(어떻게) 자체보다 판단 근거(왜)를 중심으로 기록. 근거를 알면 새로운 상황에서도 스스로 판단 가능. 구체적 구현은 코드에서 보면 됨
