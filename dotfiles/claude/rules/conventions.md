# 코드/도구 컨벤션

> 항상 적용되는 맥락 무관 규칙. 자동 관리 — /done 시 트리거 D(반복 교정)로 추출.

## NaN 체크
`Number.isNaN()` 대신 `is.nan()` 사용 (`@tossteam/is`) — 프로젝트 전체 일관성. (2026-03-07)

## Remote 응답 변환
remote에서 응답 wrapper를 벗길 때 `async/await` 대신 `.then(res => res.field)` 체이닝 사용. (2026-03-07)

## overlay + Suspense
`overlay.open` 내에서 `useSuspenseQuery` 사용하는 컴포넌트는 `<Suspense>`로 래핑 필요.
overlay는 Suspense boundary 밖에서 렌더링됨. (2026-03-07)

## as 타입 단언 금지
`as` 타입 단언 절대 사용 금지. 타입 가드나 명시적 타입 선언으로 해결.
TS 서버 일시적 에러에 `as`로 대응하지 말 것. (2026-03-11)

## 함수 인자 타입 정의
함수 인자는 무조건 interface로 분리. 인라인 타입 객체 대신 named interface 사용. (2026-03-11)

## 변수명 이중 부정 제거
`is.falsy(hasContent)` 같은 이중 부정 대신 `isEmpty` 등 직관적 변수명 사용. (2026-03-11)

## boolean 부정 표현
`!value` 대신 `is.falsy(value)` 사용. 리팩토링 중에도 `@tossteam/is` 컨벤션 유지. (ISH-1326)

## watch 사용 최소화 (react-hook-form)
`watch` 사용 최소화. 동적 검증도 가능하면 `resolver`만으로 해결. (ISH-1326)

## DTO 타입은 서버 코드 기반
DTO 타입 정의 전에 서버 소스 코드를 직접 확인. FE 코드 추론이나 string 등으로 대체하지 말 것. (ISH-1267)

## 전역 API 패턴 준수
새 API 추가 시 기존 전역 패턴(remotes/, queries/, models/)을 먼저 파악하고 동일하게 정의. (ISH-1267)

## 엔드포인트 주석 금지
DTO/remotes에 `// ── GET /path ──` 같은 엔드포인트 주석 추가 금지.
타입 이름이 이미 역할을 나타냄. (ISH-1313)

## 라이브러리 내장 API 우선
직접 구현 전 사용 중인 라이브러리의 내장 API를 먼저 검토.
예: `form.setValue`로 초기값 세팅 대신 `form.resetField` 사용. (ISH-1313)

## API 경로 버그 디버깅
API 경로 에러(Cannot POST 등) 발생 시 서버 라우팅(Controller + RouterModule) 파일을 직접 확인해 실제 경로와 대조. FE 코드만 보고 추론하지 말 것. (ISH-1328)

## code-gen 결과 보존
사용자가 제공한 code-gen(TDS 컴포넌트 코드) 결과는 절대 요약/변형/삭제하지 않는다.
code-gen의 컴포넌트명, props, 구조를 그대로 사용해서 구현한다. (2026-03-15)
