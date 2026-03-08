# Superpowers Pipeline v1 (OpenClaw)

목표: 스펙 입력 → 작업 분해 → 구현 → 검증 → 결과 보고를 스레드 기준으로 자동화.

## 빠른 시작
1) `specs/SPEC-TEMPLATE.md` 복사해서 스펙 작성
2) 스레드에서: "이 스펙으로 실행해" + 스펙 본문/파일
3) 아래 3역할로 순차 실행
   - planner: 작업 분해
   - builder: 구현
   - reviewer: 검증/요약

## 기본 역할 체인
- planner 출력: task list (우선순위/의존성/완료조건)
- builder 출력: 변경 파일 + 테스트 결과 + 리스크
- reviewer 출력: 승인/보완 + 최종 요약

## 상태 저장
- `runtime/checkpoint.json`: 현재 단계/최근 결과
- `reports/YYYY-MM-DD-<topic>.md`: 최종 보고
