# 코딩 스타일

> 프로젝트 고유의 코드 작성 패턴과 규칙. 원칙/추상화는 `code-principles.md` 참조.


## 이벤트 핸들러 네이밍

`handle{TargetName}{EventType}` 형태로 작성한다:

```typescript
// ✅ handle + 대상 + 이벤트타입
const handleFormSubmit = form.handleSubmit(async data => { ... });
const handleBoxClick = () => { ... };
const handleInputFocus = () => { ... };

<Button onClick={handleButtonClick} onFocus={handleButtonFocus} />

// ❌ 이벤트 타입이 앞에 오는 경우
const handleClickButton = () => { ... };
const handleFocusInput = () => { ... };

// ❌ on* 접두사 (props 전달용이지 핸들러 정의용이 아님)
const onSubmit = form.handleSubmit(...);
const onClick = () => { ... };
```


## useEffect 기명 함수

useEffect 콜백에는 기명 함수를 사용한다. 목적이 코드에 드러나야 한다:

```tsx
// ✅ 기명 함수 — 목적이 코드에 드러남
useEffect(function syncFormWithQuery() {
  form.reset(data);
}, [data]);

// ❌ 익명 함수 — 목적 파악에 코드 전체를 읽어야 함
useEffect(() => {
  form.reset(data);
}, [data]);
```


## Form 패턴

> **[form-patterns.md](./form-patterns.md)** 참조. react-hook-form + Zod 관련 규칙 전체를 다룸.


## Boolean Props

HTML 네이티브 속성(`open`, `disabled`, `checked`)과 일관성을 유지하기 위해 접두어 없이 작성. shorthand(`<X open />`) 대신 명시적으로 `true`/`false`를 전달하면 의도가 코드에 남는다:

```tsx
// ✅ HTML 네이티브와 일관, 명시적 값 전달
<TheBox open={true} clickable={false} animate={true} />

// ❌ 접두어 사용 — HTML 속성과 불일치
<TheBox isOpen={true} canClick={false} />

// ❌ shorthand 사용 — true가 암묵적
<Something open />
```


## Null 체크

`!= null`은 `null`과 `undefined`를 동시에 체크한다. `!!`는 `0`, `''` 같은 유효한 falsy 값까지 걸러내므로 의도와 다를 수 있다:

```tsx
// ✅ null/undefined만 체크
if (something != null) { ... }

// ❌ 0, '' 같은 유효값도 걸림
if (!!something) { ... }
// ❌ 장황
if (something === null || something === undefined) { ... }
```

**`!= null` vs `is.falsy()` 구분:** null/undefined 체크는 `!= null`, boolean 판별(truthy/falsy 전체)은 `is.falsy()`/`is.truthy()` 사용.


## 조건부 렌더링

삼항 연산자 사용. `&&` 연산자는 falsy 값(0, '')이 렌더링될 수 있으므로 지양:

```tsx
// ✅ 삼항 연산자
return <section>{title != null ? <h1>{title}</h1> : null}</section>;

// ❌ && 연산자 (boolean이 아닌 값일 때 위험)
return <section>{title && <h1>{title}</h1>}</section>;
```


## 상태 분기

여러 boolean 상태를 조합하면 불가능한 상태 조합이 생기고, 분기 누락 위험이 높아진다. 하나의 상태값으로 분기한다. 배타적 케이스별 렌더링은 `match().exhaustive()`로 처리 (자세한 패턴은 [code-principles.md §9](./code-principles.md) 참조):

```tsx
// ✅ 하나의 상태값 기준 + match로 배타적 분기
const [contentStatus, setContentStatus] = useState(ContentStatus.기본);

{match(contentStatus)
  .with(ContentStatus.수정중, () => <EditView />)
  .with(ContentStatus.보류중, () => <PendingView />)
  .with(ContentStatus.기본, () => <DefaultView />)
  .exhaustive()}

// ❌ 여러 상태값 조합 — 불가능한 상태(둘 다 true) 방지 불가
{!소재보류 && !소재수정 && (...)}
```


## TypeScript Enum 금지

일반 enum은 IIFE로 컴파일되어 트리셰이킹이 불가능하고 런타임 코드를 생성한다. `const enum`은 인라인되지만 `isolatedModules` 환경(Next.js, Vite 기본값)에서 사용 불가하므로, 일관성을 위해 `as const` 객체 또는 union type을 사용한다:

```typescript
// ❌ enum — 트리셰이킹 불가, 런타임 코드 생성
enum Status { Active = 'active', Inactive = 'inactive' }

// ✅ as const 객체 또는 union type
const Status = { Active: 'active', Inactive: 'inactive' } as const;
type Status = (typeof Status)[keyof typeof Status];
```


## console.log 금지

프로덕션 코드에 `console.log` 금지. hooks에서 자동 감지.


## Props 구조분해할당

`props.`가 반복되면 가독성이 떨어지고, 사용하는 prop이 함수 시그니처에서 바로 보이지 않는다. bypass(`{...props}`)가 아닌 한 구조분해할당:

```tsx
// ✅ 사용하는 prop이 시그니처에 드러남
function Wrapper({ children }: Props) {
  return <div>{children}</div>;
}

// ❌ props.children, props.onClick... 반복
function Wrapper(props: Props) {
  return <div>{props.children}</div>;
}
```


## 컴포넌트 return null

React 컴포넌트는 항상 `ReactNode`를 반환해야 한다. 렌더링할 element가 없을 때 빈 Fragment(`<></>`)보다 `null`이 "렌더링 없음"이라는 의도를 명확히 전달:

```tsx
// ✅ 의도 명확
function EffectComponent() {
  useEffect(function syncData() { /* ... */ });
  return null;
}
```


## Non-null Assertion

`useSuspenseQuery`처럼 **런타임에 데이터 존재가 보장된 경우에 한해** `!` 사용. 불필요한 optional chaining은 "데이터가 없을 수 있다"는 잘못된 신호를 준다.

**적용 범위:** Suspense 보장 데이터만. form 데이터, API 파라미터 등은 [code-principles.md §11](./code-principles.md) Type Guard 패턴 사용.

```typescript
// ✅ Suspense로 존재 보장 → ! 허용
const { data } = useSuspenseQuery(query);
const name = data!.contents.name;

// ❌ optional chaining → "없을 수 있다"는 잘못된 신호
const name = data?.contents.name;
```


## Nilable vs Optional 파라미터

함수 시그니처에서 호출자의 의도를 전달하기 위해 구분한다. `?`는 "안 넘겨도 됨", `| undefined`는 "넘기되 값이 없을 수 있음":

```typescript
// ✅ 호출: apply() — 인자 자체를 안 넘기는 게 자연스러운 경우
function apply(name?: string) { ... }

// ✅ 호출: apply(maybeValue) — 인자는 항상 넘기되 undefined일 수 있는 경우
function apply(name: string | undefined) { ... }
```


## interface vs type 기준

interface는 extends로 확장 가능하고 에러 메시지가 읽기 좋다. type은 유니온/교차/추론에 특화. 객체 형태는 interface, 나머지는 type:

```typescript
// ✅ interface: 객체 형태 — 확장 가능, 에러 메시지 가독성
interface UserProps {
  name: string;
  age: number;
}

// ✅ type: 유니온, 추론 — interface로 표현 불가
type Status = 'active' | 'inactive';
type AComponentProps = ComponentProps<typeof A>;
```


## export default 금지

named export는 자동 import 지원, 리네이밍 시 사용처 추적이 가능. default export는 import 이름이 자유라 파일마다 다른 이름을 쓸 수 있어 일관성이 깨진다. Next.js pages 디렉토리는 프레임워크 요구사항이므로 예외:

```typescript
// ✅ named export — 자동 import, 이름 일관성
export { ListItem };
export { MyPage as default } from 'pages/MyPage'; // pages만 예외

// ❌ export default — import 이름이 자유, 추적 어려움
export default ListItem;
```


## reduce 규칙

`as` 타입 단언은 런타임 안전성을 보장하지 않는다. 제네릭으로 타입을 지정하면 컴파일타임에 검증. initialValue 없이 빈 배열에서 호출하면 런타임 에러:

```typescript
// ✅ 제네릭으로 타입 지정 — 컴파일타임 검증
arr.reduce<Record<string, Item>>((acc, curr) => {
  acc[curr.id] = curr;
  return acc;
}, {});

// ❌ 타입단언 — 런타임 불일치 가능
arr.reduce((acc, curr) => {
  acc[curr.id] = curr;
  return acc;
}, {} as Record<string, Item>);
```


## 고차함수 변수명

복수형→단수형 패턴이면 "무엇을 순회하는지" 코드에서 바로 읽힌다. `item`, `el` 같은 무의미한 변수는 컬렉션의 도메인을 숨긴다:

```typescript
// ✅ 복수 → 단수 — 도메인이 드러남
users.map(user => user.name);
orders.filter(order => order.status === 'active');

// ❌ 도메인이 숨겨짐
list.map(({ name }) => name);
```


## 한글 변수명

도메인 용어가 영어 번역 시 의미가 달라지거나 모호해지면 한글이 더 정확하다. 영어로 충분히 표현되는 범용 개념은 영어 유지:

```typescript
// ✅ 영어 번역이 모호하거나 의미 왜곡 — 한글이 정확
const 급여명세서 = '...';
const 시차출퇴근근무제도 = '...';

// ❌ 영어로 충분 — 불필요한 한글
const 유저들 = []; // users
const 비활성화인가 = false; // disabled
```


## 하드코딩 → 상수 선언

**2곳 이상 사용되거나 의미가 불명확한 매직 넘버**만 상수로 추출. 1회용 인라인 문자열은 상수 추출하지 않는다 — [code-principles.md 이른 추상화 안티패턴](./code-principles.md) 참조:

```typescript
// ✅ 2곳 이상 사용 + 의미 불명확 → 상수
const 최대_퀴즈_개수 = 3;
if (fields.length > 최대_퀴즈_개수) { ... }

// ✅ 1회용 + 의미 명확 → 인라인 유지
<Radio label="선출고 가능" checked={field.value === '선출고 가능'} />

// ❌ 매직 넘버 — 3이 뭔지 모름
if (fields.length > 3) { ... }
```


## 타입 좁히기와 클로저

재할당 가능한 변수(let, catch 파라미터 등)는 클로저 함수 경계에서 좁혀진 타입이 소실될 수 있다. (TS 5.4+에서 const/재할당 없는 변수는 개선됨.) 안전하게 콜백에서 사용하려면 먼저 변수에 추출한다:

```typescript
// ❌ 클로저 안에서 좁혀진 타입 소실
if (isApiError(err)) {
  someCallback(() => {
    console.log(err.message); // TS 에러: err은 여전히 unknown
  });
}

// ✅ 좁혀진 스코프에서 값을 먼저 추출
if (isApiError(err)) {
  const errorMessage = err.message; // string으로 확정
  someCallback(() => {
    console.log(errorMessage); // OK
  });
}
```


## 구조/추상화 원칙

> A-B-A-B 분산 금지, 분리≠추상화, 이른 추상화 안티패턴 등은 **[code-principles.md](./code-principles.md)** §3, §5 참조.


## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2026-02-08 | 초판 |
| 2026-03-04 | useEffect 기명함수, Form 패턴, Enum 금지 추가 |
| 2026-03-04 | 범용 섹션(Immutability, Error Handling, Input Validation) 제거 — 프로젝트 특화 내용만 유지 |
| 2026-03-04 | A-B-A-B, 분리≠추상화 중복 제거 → code-principles.md 참조로 변경 |
| 2026-03-15 | Form 섹션 보강 — Zod 필수, register vs Controller, isValid 위임, 서버 동기화 규칙 추가 |
| 2026-04-04 | 11개 규칙 추가 — Props 구조분해, return null, Non-null Assertion, Nilable vs Optional, interface vs type, export default 금지, reduce 규칙, 고차함수 변수명, 한글 변수명, 하드코딩 상수화, Toss 패키지 |
| 2026-04-04 | Form 섹션 → form-patterns.md로 분리 |
| 2026-04-04 | 회사 전용 섹션(@tossteam/is, overlay-kit, Toss 패키지) → conventions-ishopcare/libraries.md로 분리 |
| 2026-04-04 | 전체 품질 개선 — WHY + 판단 기준 추가, 상충 해소 (하드코딩/Non-null/상태분기/Null체크) |
