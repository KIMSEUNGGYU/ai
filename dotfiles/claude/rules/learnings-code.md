# 코드 컨벤션 학습 기록

> /done 시 자가학습으로 자동 업데이트. 간결 유지 (30~50줄).

## NaN 체크
- `Number.isNaN()` 대신 `is.nan()` 사용 (`@tossteam/is`) — 프로젝트 전체 일관성 <!-- learned: 2026-03-07, task: 주문-서류-상세 -->

## Remote 응답 변환
- remote에서 응답 wrapper를 벗길 때 `async/await` 대신 `.then(res => res.field)` 체이닝 사용 <!-- learned: 2026-03-07, task: 주문_서류_상세 -->

## overlay + Suspense
- `overlay.open` 내에서 `useSuspenseQuery` 사용하는 컴포넌트는 `<Suspense>`로 래핑 필요 — overlay는 Suspense boundary 밖에서 렌더링됨 <!-- learned: 2026-03-07, task: 주문_서류_상세 -->
