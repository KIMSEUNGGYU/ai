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


## Form 패턴 (react-hook-form + Zod)

> 상세 사용법은 `references/react-hook-form.md` 참조.

### 기본 조합

폼 입력은 react-hook-form, 검증은 항상 Zod. 둘은 세트로 사용한다:

```tsx
// ✅ useForm + zodResolver + handleSubmit + mutateAsync
const form = useForm<FormData>({
  resolver: zodResolver(schema),  // 검증은 항상 Zod
  defaultValues: { name: '' },
});

const handleFormSubmit = form.handleSubmit(async (data) => {
  try {
    await createMutation.mutateAsync(data);
    showSuccessToast('등록 완료');
  } catch (error) {
    showApiErrorToast(error);
  }
});

// ❌ zodResolver 없이 수동 검증
// ❌ onSubmit에서 form.getValues() 사용
```

### register vs Controller

| 상황 | API |
|------|-----|
| TextField, Input (표준 HTML) | `register` |
| Select, DatePicker, Autocomplete (TDS) | `Controller` |

register로 충분하면 Controller 사용 금지.

### useFieldArray

동적 리스트에서 **`key={field.id}` 필수**. index를 key로 사용 금지 (리렌더링 버그).

### submit 비활성화

`formState.isValid`에 위임. watch로 유효성을 직접 계산하지 않는다:

```tsx
// ✅ isValid에 위임
const form = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' });
<Button disabled={is.falsy(form.formState.isValid)}>저장</Button>

// ❌ watch로 유효성 직접 계산 — 스키마 검증과 중복
const isValid = is.truthy(form.watch('name')) && is.truthy(form.watch('phone'));
```

### 서버 데이터 동기화

`defaultValues`는 마운트 시에만 적용. mutation 후 refetch된 데이터 반영은 `useEffect + reset()`:

```tsx
useEffect(function syncFormWithServerData() {
  reset({ items: data });
}, [data, reset]);
```


## @tossteam/is 라이브러리

프로젝트 전체에서 `@tossteam/is` 라이브러리를 boolean 판별에 사용한다. `!` 연산자나 직접 boolean 변환으로 대체하지 않는다.

```typescript
// ✅ is 라이브러리 사용 (프로젝트 컨벤션)
import { is } from '@tossteam/is';

const invalidFile = selected.find(f => is.falsy(ALLOWED_EXTENSIONS.includes(getFileExtension(f.name))));
const removed = files.filter(file => is.truthy(selectedFiles.has(file.downloadUrl)));
onFilesChange(files.filter(file => is.falsy(selectedFiles.has(file.downloadUrl))));

// ❌ 직접 boolean 연산 (리뷰에서 제안되어도 거부)
const invalidFile = selected.find(f => !ALLOWED_EXTENSIONS.includes(getFileExtension(f.name)));
const removed = files.filter(file => selectedFiles.has(file.downloadUrl));
```


## Boolean Props

접두어(`is`, `can`, `has`) 없이, 명시적으로 `true`/`false` 전달:

```tsx
// ✅
<TheBox open={true} clickable={false} animate={true} />

// ❌ 접두어 사용
<TheBox isOpen={true} canClick={false} />

// ❌ shorthand 생략
<Something open />
```


## Null 체크

`!= null`로 null/undefined 동시 체크:

```tsx
// ✅
if (something != null) { ... }

// ❌
if (!!something) { ... }
if (something === null || something === undefined) { ... }
```


## 조건부 렌더링

삼항 연산자 사용. `&&` 연산자는 falsy 값(0, '')이 렌더링될 수 있으므로 지양:

```tsx
// ✅ 삼항 연산자
return <section>{title != null ? <h1>{title}</h1> : null}</section>;

// ❌ && 연산자 (boolean이 아닌 값일 때 위험)
return <section>{title && <h1>{title}</h1>}</section>;
```


## 상태 분기

여러 상태값 조합 대신, 하나의 상태값으로 분기:

```tsx
// ✅ 하나의 상태값 기준
const [contentStatus, setContentStatus] = useState(ContentStatus.기본);

<SwitchCase
  value={contentStatus}
  caseBy={{
    ContentStatus.수정중: ...,
    ContentStatus.보류중: ...,
    ContentStatus.기본: ...
  }}
/>

// ❌ 여러 상태값 조합
{!소재보류 && !소재수정 && (...)}
```


## Modal / Dialog

`overlay-kit`의 `overlay.open` 패턴을 사용한다. 컴포넌트 상태(`useState`)로 모달을 제어하지 않는다:

```tsx
import { overlay } from 'overlay-kit';
import { AlertDialog } from 'components/Dialog';

// ✅ overlay.open 패턴
const handleDeleteClick = () => {
  overlay.open(({ isOpen, close }) => (
    <AlertDialog
      isOpen={isOpen}
      close={close}
      title="삭제할까요?"
      description="삭제 후 복구할 수 없어요."
      onConfirm={async () => {
        await deleteMutation.mutateAsync(params);
        close();
      }}
    />
  ));
};

// ❌ useState로 모달 제어
const [isDialogOpen, setIsDialogOpen] = useState(false);
<Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
```

공용 `AlertDialog` (`components/Dialog.tsx`)를 우선 사용하고, 커스텀 모달이 필요한 경우에만 TDS `AlertDialog`를 직접 사용한다.


## TypeScript Enum 금지

enum은 트리셰이킹이 불가능하고 런타임 코드를 생성한다. `as const` 객체 또는 union type을 사용한다:

```typescript
// ❌ enum — 트리셰이킹 불가, 런타임 코드 생성
enum Status { Active = 'active', Inactive = 'inactive' }

// ✅ as const 객체 또는 union type
const Status = { Active: 'active', Inactive: 'inactive' } as const;
type Status = (typeof Status)[keyof typeof Status];
```


## console.log 금지

프로덕션 코드에 `console.log` 금지. hooks에서 자동 감지.


## 구조/추상화 원칙

> A-B-A-B 분산 금지, 분리≠추상화, 이른 추상화 안티패턴 등은 **[code-principles.md](./code-principles.md)** §3, §5 참조.


## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2026-02-08 | 초판 |
| 2026-03-04 | useEffect 기명함수, Form 패턴, Enum 금지 추가 |
| 2026-03-04 | 범용 섹션(Immutability, Error Handling, Input Validation) 제거 — 프로젝트 특화 내용만 유지 |
| 2026-03-04 | A-B-A-B, 분리≠추상화 중복 제거 → code-principles.md 참조로 변경 |
| 2026-03-15 | Form 섹션 보강 — Zod 필수, register vs Controller, isValid 위임, 서버 동기화 규칙 추가. references/react-hook-form.md 신규 |
