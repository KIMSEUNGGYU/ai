# 코드 컨벤션 학습 기록

> /done 시 자가학습으로 자동 업데이트. 간결 유지 (30~50줄).

## NaN 체크
- `Number.isNaN()` 대신 `is.nan()` 사용 (`@tossteam/is`) — 프로젝트 전체 일관성 <!-- learned: 2026-03-07, task: 주문-서류-상세 -->

## Remote 응답 변환
- remote에서 응답 wrapper를 벗길 때 `async/await` 대신 `.then(res => res.field)` 체이닝 사용 <!-- learned: 2026-03-07, task: 주문_서류_상세 -->

## overlay + Suspense
- `overlay.open` 내에서 `useSuspenseQuery` 사용하는 컴포넌트는 `<Suspense>`로 래핑 필요 — overlay는 Suspense boundary 밖에서 렌더링됨 <!-- learned: 2026-03-07, task: 주문_서류_상세 -->

## as 타입 단언 금지
- `as` 타입 단언 절대 사용 금지 — 타입 가드나 명시적 타입 선언으로 해결. TS 서버 일시적 에러에 `as`로 대응하지 말 것 <!-- learned: 2026-03-11, task: 주문_서류_상세 -->

## 함수 인자 타입 정의
- 함수 인자는 무조건 interface로 분리 — 인라인 타입 객체(`{ a: string; b: number }`) 대신 named interface 사용 <!-- learned: 2026-03-11, task: 주문_서류_상세 -->

## 변수명 이중 부정 제거
- `is.falsy(hasContent)` 같은 이중 부정 대신 `isEmpty` 등 직관적 변수명 사용 — 조건문에서 바로 읽히도록 <!-- learned: 2026-03-11, task: 주문_서류_상세 -->

## boolean 부정 표현
- `!value` 대신 `is.falsy(value)` 사용 — 리팩토링 중에도 `@tossteam/is` 컨벤션 유지, `!`로 되돌리지 말 것 <!-- learned: 2026-03-11, task: ISH-1326 -->

## watch 사용 최소화 (react-hook-form)
- `watch` 사용 최소화 — 동적 검증도 가능하면 `resolver`만으로 해결, `isDynamicFieldsValid` 같은 watch 파생값 지양 <!-- learned: 2026-03-11, task: ISH-1326 -->

## DTO 타입은 서버 코드 기반
- DTO 타입 정의 전에 서버 소스 코드를 직접 확인하라 — FE 코드 추론이나 string 등으로 대체하지 말 것 <!-- learned: 2026-03-12, task: ISH-1267 -->

## 전역 API 패턴 준수
- 새 API 추가 시 기존 전역 패턴(remotes/, queries/, models/)을 먼저 파악하고 동일하게 정의 — 독자적 패턴 사용 금지 <!-- learned: 2026-03-12, task: ISH-1267 -->

## 엔드포인트 주석 금지
- DTO/remotes에 `// ── GET /path ──` 같은 엔드포인트 주석 추가 금지 — 타입 이름(`Fetch*Params`, `Post*Params`)이 이미 역할을 나타냄 <!-- learned: 2026-03-13, task: ISH-1313 -->

## 라이브러리 내장 API 우선
- 직접 구현하기 전에 사용 중인 라이브러리의 내장 API를 먼저 검토하라 — 예: `form.setValue`로 초기값 세팅 대신 `form.resetField` 사용 <!-- learned: 2026-03-12, task: ISH-1313 -->

## API 경로 버그 디버깅
- API 경로 에러(Cannot POST 등) 발생 시 서버 라우팅(Controller + RouterModule) 파일을 직접 확인해 실제 경로와 대조하라 — FE 코드만 보고 추론하지 말 것 <!-- learned: 2026-03-13, task: ISH-1328 -->

