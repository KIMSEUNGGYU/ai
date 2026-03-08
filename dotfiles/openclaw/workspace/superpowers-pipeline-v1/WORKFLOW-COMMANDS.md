# 실행 명령 예시 (스레드에서)

## 0) 스펙 전달
"아래 스펙으로 pipeline v1 실행해"
(스펙 본문 첨부)

## 1) planner
sessions_spawn(task="planner 프롬프트로 스펙 분해", mode="run", cleanup="keep")

## 2) builder
sessions_spawn(task="planner 출력 기준으로 구현 진행", mode="run", cleanup="keep")

## 3) reviewer
sessions_spawn(task="builder 결과 검증 후 판정", mode="run", cleanup="keep")

## 4) 최종 보고
"reviewer 결과를 reports 파일 형식으로 요약"
