# Form 패턴 (react-hook-form + Zod)

> 폼 상태는 react-hook-form, 검증은 Zod. 둘은 세트로 사용한다.


## 기본 조합

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


## register vs Controller

| 상황 | API |
|------|-----|
| TextField, Input (표준 HTML) | `register` |
| Select, DatePicker, Autocomplete (TDS) | `Controller` |

register로 충분하면 Controller 사용 금지.


## useFieldArray

동적 리스트에서 **`key={field.id}` 필수**. index를 key로 사용 금지 (리렌더링 버그).


## submit 비활성화

`formState.isValid`에 위임. watch로 유효성을 직접 계산하지 않는다:

```tsx
// ✅ isValid에 위임
const form = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' });
<Button disabled={is.falsy(form.formState.isValid)}>저장</Button>

// ❌ watch로 유효성 직접 계산 — 스키마 검증과 중복
const isValid = is.truthy(form.watch('name')) && is.truthy(form.watch('phone'));
```


## 서버 데이터 동기화

`defaultValues`는 마운트 시에만 적용. mutation 후 refetch된 데이터 반영은 `useEffect + reset()`:

```tsx
useEffect(function syncFormWithServerData() {
  reset({ items: data });
}, [data, reset]);
```


## register setValueAs + onChange (값과 포맷 분리)

화면에는 포맷팅된 값, 폼 내부에는 원시 값을 저장한다:

```typescript
// ✅ register: setValueAs로 폼 값, onChange로 화면 포맷
<TextField
  maxLength={12}
  {...form.register('businessNumber', {
    setValueAs: value => {
      if (value === '') return undefined;
      return onlyNumbers(value);
    },
    onChange: e => {
      e.target.value = formatBusinessNumber(onlyNumbers(e.target.value));
    },
  })}
/>

// ✅ Controller: value에 포맷 함수, onChange에 원시값
<Controller
  name="businessNumber"
  control={control}
  render={({ field: { value, onChange } }) => (
    <TextField
      value={formatBusinessNumber(value)}
      onChange={e => onChange(onlyNumbers(e.target.value))}
    />
  )}
/>
```


## Optional 필드: 빈 문자열 → undefined 변환

Zod의 `.optional()`은 `undefined`만 허용. TextField의 빈 문자열은 `setValueAs`로 변환한다:

```typescript
// ✅ setValueAs로 변환
{...form.register('businessNumber', {
  setValueAs: value => value === '' ? undefined : value
})}

// 스키마는 깔끔하게 유지
businessNumber: z.string().regex(/^\d{10}$/).optional()

// ❌ z.union으로 빈 문자열 허용 — 타입이 장황해짐
businessNumber: z.union([z.string().regex(/^\d{10}$/), z.literal('')]).optional()
```


## 동적 Zod 스키마 + as Resolver

React Hook Form은 단일 타입만 허용. 조건별 동적 스키마 전환 시 `as Resolver` 타입 단언이 구조적으로 불가피하다:

```typescript
/**
 * React Hook Form은 단일 타입만 지원하므로
 * 동적 스키마를 위해 as Resolver 타입 단언이 필요.
 * 실제 검증은 Zod가 런타임에 수행하므로 타입 안전성은 보장됨.
 */
const form = useForm<TidRegistrationFormData>({
  resolver: zodResolver(getTidRegistrationSchema(van)) as Resolver<TidRegistrationFormData>,
});
```


## Zod refine은 TypeScript 타입을 좁히지 않는다

`.refine()`은 런타임 검증만 수행하고 컴파일타임 타입에 영향을 주지 않는다:

```typescript
// refine으로 빈 문자열 제거했어도 TypeScript는 인식 못함
const VANSchema = z
  .union([...VAN_LIST.map(van => z.literal(van)), z.literal('')])
  .refine(val => val !== '', { message: 'VAN은 필수예요' });

// z.infer<typeof VANSchema> = '' | 'NICE' | 'KIS' | ... (빈 문자열 포함)
// → submit 시 as Van 단언 필요 (런타임 안전성은 Zod가 보장)
```


## useImperativeHandle로 자식 상태 초기화

`form.reset()`으로는 자식 컴포넌트의 로컬 상태(useState)가 초기화되지 않는다. ref + useImperativeHandle로 초기화 메서드를 노출한다:

```typescript
// 자식: reset 메서드 노출
export interface FieldGroupRef { reset: () => void; }

export const BusinessFieldGroup = forwardRef<FieldGroupRef>((_, ref) => {
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  useImperativeHandle(ref, () => ({
    reset: () => setIsAutoFilled(false),
  }));
});

// 부모: form.reset + 자식 상태 초기화
const fieldRef = useRef<FieldGroupRef>(null);
const handleSuccess = () => {
  form.reset();
  fieldRef.current?.reset();
};
```


## Select 초기값: nullable + refine

Select의 "미선택" 상태를 `null`로 표현하고, `refine`으로 non-null 검증한다:

```typescript
taskStatus: z
  .enum(STATUS_LIST)
  .nullable()
  .refine((v): v is TaskStatusType => v != null, '업무 상태를 선택해주세요'),

defaultValues: { taskStatus: null }
```


## 동적 스키마: superset interface + subset 스키마

`z.infer`가 union이 되어 사용 불가할 때, 폼 타입은 interface로 직접 정의(superset), 스키마는 현재 조건의 subset으로 분리한다:

```typescript
// 타입: 모든 필드의 superset (고정)
export interface WorkLogFormInput {
  taskStatus: TaskStatusType | null;
  cancelReason: string | null;      // 취소일 때만
  complementRows: { ... }[];        // 보완 발송일 때만
}

// 스키마: 현재 조건의 subset (동적)
export function createWorkLogFormSchema(status, isIPartners) { ... }
```


## resolver 안에서 동적 스키마 생성

폼 값 + 외부 값 조합으로 스키마가 결정될 때, resolver 함수 안에서 동적으로 스키마를 생성한다:

```typescript
const form = useForm<WorkLogFormInput>({
  resolver: (values, context, options) => {
    const schema = createWorkLogFormSchema(values.taskStatus, isIPartners);
    return zodResolver(schema)(values, context, options);
  },
});
```


## safeParse로 버튼 활성화

동적 스키마라 `mode: 'onChange'`의 `isValid`가 불충분할 때, `safeParse`로 직접 유효성 판단. 단, `form.watch()`는 매 입력마다 전체 리렌더링을 유발하므로 필드가 많은 폼에서는 성능 주의:

```typescript
const watchedValues = form.watch();
const currentSchema = createWorkLogFormSchema(watchedValues.taskStatus, isIPartners);
const isFormValid = currentSchema.safeParse(watchedValues).success;

<Button disabled={!isFormValid}>저장</Button>
```


## mode별 isValid 동작 차이

| mode | isValid 동작 |
|------|-------------|
| `onChange` | 매 입력마다 검증, 즉시 반영 |
| `onSubmit` | resolver 없으면 첫 submit 전까지 false. resolver 있으면 마운트 시 초기 검증 수행 (v7.49+) |

```typescript
// mode: 'onSubmit' + resolver 없음 → isValid가 첫 submit 전까지 false
<Button disabled={!form.formState.isValid}>저장</Button>  // ⚠️ 의도와 다를 수 있음

// shouldValidate: mode 무관하게 즉시 검증 트리거
form.setValue('name', 'value', { shouldValidate: true });

// trigger: 항상 동작, Promise<boolean> 반환
await form.trigger('name');
```


## register 프로그래매틱 값 변경 한계

register는 uncontrolled이므로 `setValue`로 값을 바꿔도 DOM에 반영되지 않는 경우가 있다. 프로그래매틱 값 변경이 필요한 필드는 Controller 사용:

```typescript
// ❌ register + setValue → DOM 미반영 가능
{...form.register('serial')}
form.setValue('serial', fetchedValue); // input에 안 보일 수 있음

// ✅ Controller → 항상 value 동기화
<Controller
  name="serial"
  control={form.control}
  render={({ field }) => <TextField {...field} />}
/>
```


## watch vs useWatch

| 상황 | 사용 |
|------|------|
| 같은 컴포넌트 내 | `watch` |
| 자식 컴포넌트로 분리 | `useWatch` (control prop 전달) |

`useWatch`는 해당 컴포넌트만 리렌더링되어 성능 유리:

```typescript
// 분리된 자식 — useWatch로 격리
function PasswordStrength({ control }: { control: Control<FormValues> }) {
  const password = useWatch({ control, name: 'password' });
  return <StrengthBar value={calculateStrength(password)} />;
}
```


## Zod 독립 사용: 필터 검증 스키마

react-hook-form 없이도 Zod를 독립적으로 사용하여 필터/검색 조건을 검증할 수 있다. 검증 정책이 스키마에 응집되고, `safeParse`로 에러 메시지를 UI에 바로 표시:

```typescript
// schemas/bookingFilter.schema.ts — 검증 정책 응집
const bookingFilterSchema = z
  .object({
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    attendees: z.number().min(1, '참석 인원은 1명 이상이어야 합니다.'),
  })
  .refine(data => data.endTime > data.startTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다.',
  });

// 컴포넌트에서 사용 — react-hook-form 없이 검증
const result = bookingFilterSchema.safeParse({ startTime, endTime, attendees });
if (!result.success) {
  return <ErrorText message={result.error.issues[0].message} />;
}
```

**판단 기준:** 폼 제출이 있으면 react-hook-form + zodResolver, 필터/검색 같은 실시간 검증이면 Zod 독립 사용.


---

## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2026-04-04 | coding-style.md에서 Form 섹션 분리 + 6개 고급 패턴 추가 (setValueAs 포맷팅, Optional 변환, 동적 스키마, refine 한계, useImperativeHandle) |
| 2026-04-04 | 7개 패턴 추가 — Select nullable+refine, superset/subset 스키마, resolver 동적 생성, safeParse, mode별 isValid, register 한계, watch vs useWatch |
| 2026-04-04 | Zod 독립 사용(필터 검증 스키마) 추가 (Toss 모의고사 PR 학습) |
