# 학습된 FE 규칙

> /done 자가학습에서 축적된 규칙. 다른 컨벤션 파일에 아직 통합되지 않은 임시 규칙.
> 정기적으로 검토하여 해당 파일로 통합하거나 삭제한다.

## 타입 안전성

- `as` 타입 단언 금지. 타입 가드나 명시적 타입 선언으로 해결. 단, 타입 가드 내부의 `as any`는 unknown→구조 체크 과정에서 불가피한 예외.
- DTO 타입 정의 전에 서버 소스 코드를 직접 확인. FE 코드 추론이나 string 등으로 대체하지 말 것. 서버 DTO가 변경되면 FE 타입도 틀어짐.

## React 패턴

- `watch` 사용 최소화. 동적 검증도 가능하면 `resolver`만으로 해결. watch는 매 입력마다 전체 리렌더링을 유발. (→ form-patterns.md watch vs useWatch 참조)
- `isEditable` 분기가 필드마다 반복되면 view/edit 컴포넌트를 분리. 같은 파일 안에서 고수준(export, 분기) → 저수준(view, edit, 헬퍼) 순서로 배치. 분기 중복은 가독성을 해치고 변경 시 누락 위험.
- prop 이름은 동작 의도를 정확히 반영. `onComplete`인데 선택 시점에 호출되면 사용자가 오해. 최소 놀람의 원칙.
- 동일 조건 분기가 여러 곳에 중복되면 단일 함수로 통합. 조건이 바뀔 때 한 곳만 수정하면 되도록 (SSOT).

## API/서버 연동

- remote 응답 wrapper를 벗길 때 `async/await` 대신 `.then(res => res.field)` 체이닝 사용. async 함수로 감싸면 불필요한 Promise 래핑이 추가되고, remote가 이미 Promise를 반환하므로 체이닝이 간결.
- 새 API 추가 시 기존 전역 패턴(remotes/, queries/, models/)을 먼저 파악하고 동일하게 정의. 일관성이 깨지면 유지보수 비용 증가.
- API 경로 에러(Cannot POST 등) 발생 시 서버 라우팅(Controller + RouterModule) 파일을 직접 확인해 실제 경로와 대조. FE 코드만 보고 추측하지 말 것.

## 코드 품질

- code-gen(TDS 컴포넌트 코드) 결과는 절대 요약/변형/삭제하지 않는다. 컴포넌트명, props, 구조를 그대로 사용. 디자인 시스템의 의도가 왜곡됨.
- presigned URL 등에서 파일 확장자를 정규식으로 추출할 때 `$` 대신 `(\?|$)` 사용. URL에 쿼리스트링이 붙으면 `$`로는 매칭 실패.
- 코드 변경 후 typecheck(`pnpm -F [서비스] typecheck`)와 biome(`pnpm check`) 둘 다 실행. 한쪽만 돌리면 다른 쪽 에러를 놓침.
