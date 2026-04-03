# 학습된 FE 규칙

> /done 자가학습에서 축적된 규칙. 실제 코드 리뷰/구현에서 반복 교정된 패턴.

## 타입 안전성

- `as` 타입 단언 절대 금지. 타입 가드나 명시적 타입 선언으로 해결. TS 서버 일시적 에러에 `as`로 대응하지 말 것.
- 함수 인자는 무조건 interface로 분리. 인라인 타입 객체 대신 named interface 사용.
- DTO 타입 정의 전에 서버 소스 코드를 직접 확인. FE 코드 추론이나 string 등으로 대체하지 말 것.

## @tossteam/is 일관성

- `Number.isNaN()` 대신 `is.nan()` 사용.
- `!value` 대신 `is.falsy(value)` 사용. 리팩토링 중에도 유지.
- `is.falsy(hasContent)` 같은 이중 부정 대신 `isEmpty` 등 직관적 변수명.

## React 패턴

- `overlay.open` 내에서 `useSuspenseQuery` 사용하는 컴포넌트는 `<Suspense>`로 래핑 필요. overlay는 Suspense boundary 밖에서 렌더링됨.
- `watch` 사용 최소화. 동적 검증도 가능하면 `resolver`만으로 해결.
- `isEditable` 분기가 필드마다 반복되면 view/edit 컴포넌트를 분리. 같은 파일 안에서 고수준(export, 분기) → 저수준(view, edit, 헬퍼) 순서로 배치.
- prop 이름은 동작 의도를 정확히 반영. `onComplete`인데 선택 시점에 호출되면 혼란.
- 동일 조건 분기가 여러 곳에 중복되면 단일 함수로 통합.

## API/서버 연동

- remote 응답 wrapper를 벗길 때 `async/await` 대신 `.then(res => res.field)` 체이닝 사용.
- 새 API 추가 시 기존 전역 패턴(remotes/, queries/, models/)을 먼저 파악하고 동일하게 정의.
- DTO/remotes에 `// ── GET /path ──` 같은 엔드포인트 주석 추가 금지. 타입 이름이 이미 역할을 나타냄.
- API 경로 에러(Cannot POST 등) 발생 시 서버 라우팅(Controller + RouterModule) 파일을 직접 확인해 실제 경로와 대조.

## 코드 품질

- code-gen(TDS 컴포넌트 코드) 결과는 절대 요약/변형/삭제하지 않는다. 컴포넌트명, props, 구조를 그대로 사용.
- zod 스키마의 baseFields는 도메인적으로 공통인 필드만 포함. 특정 조건 필드는 스키마 분기에서 별도 정의.
- presigned URL 등에서 파일 확장자를 정규식으로 추출할 때 `$` 대신 `(\?|$)` 사용. 쿼리스트링 고려.
- 코드 변경 후 typecheck(`pnpm -F [서비스] typecheck`)와 biome(`pnpm check`) 둘 다 실행.
