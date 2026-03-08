# Two-Agent Kit (OpenClaw + Discord)

## 목표
- 서로 다른 두 맥북의 OpenClaw 에이전트가 같은 Discord 채널에서 협업
- 세션 초기화/중단에도 작업을 복구

## 구조 (3-Layer)
- Fact Layer: `memory/`, `state.json`(선택)
- Meta Layer: `AGENTS.md`, `SOUL.md` 규칙
- Runtime Layer: `runtime/events.jsonl`, `runtime/checkpoint.json`

## 폴더
- `tasks/` 작업 단위 파일
- `handoff/` 에이전트 간 인계 메시지
- `memory/` 영구 메모
- `runtime/` 실행 로그/체크포인트

## 기본 프로토콜
1. leader가 `tasks/TASK-xxxx.md` 생성
2. builder가 상태 갱신 (`todo -> doing -> review -> done`)
3. 완료 시 `handoff/HANDOFF-xxxx.md` 작성
4. 모든 단계에서 `runtime/events.jsonl`에 로그 append

## Discord 운영 팁
- 채널은 한 개로 시작
- 멘션 패턴: `@leader`, `@builder`
- SSOT는 Git (항상 pull -> 작업 -> commit/push)

