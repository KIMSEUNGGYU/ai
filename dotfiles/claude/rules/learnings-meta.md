# 자가학습 시스템 메타 학습 기록

> /done 시 자가학습으로 자동 업데이트. 간결 유지 (30~50줄).

## 자가학습 실행 원칙
- 자가학습은 session_id 유무와 관계없이 항상 수행 — session_id 없으면 현재 세션 transcript 사용 <!-- learned: 2026-03-07, task: 주문_서류_상세 -->
- active 파일 0개여도 자가학습은 정상 실행 — "종료"로 스킵하지 않음 <!-- learned: 2026-03-07, task: 주문_서류_상세 -->
- archive 저장은 실질적 가치가 낮으면 제거 검토 대상 <!-- learned: 2026-03-07, task: 주문_서류_상세 -->
- 플러그인 버전 업데이트 후 반영 시점 안내 — exit 후 새 세션에서 반영됨을 명시 <!-- learned: 2026-03-09, task: self-learning-improvement -->
- 자가학습 항목은 AI 행동 개선에 직접 연결되어야 함 — 일반적 관찰이나 도메인 지식이 아닌, "다음에 이렇게 하라"는 행동 교정만 추출할 것 <!-- learned: 2026-03-14, task: cc-monitor-개선 -->
- 정적 규칙 파일(pc-map.md, profile.md 등)도 매 판단 시 참조 대상이다 — learnings만 보지 말고 rules 파일도 먼저 읽고 확인 후 행동 <!-- learned: 2026-03-14, task: 자가학습-시스템-개선 -->
  - TRIGGER: 판단이 필요한 작업 시작 시
  - ACTION: 관련 rules 파일을 먼저 읽고 규칙에 맞는지 확인한 후 행동
