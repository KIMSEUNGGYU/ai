# react-hook-form + Zod 레퍼런스

> 규칙은 `conventions/coding-style.md` Form 섹션 참조. 여기는 상세 사용법.

---

## register vs Controller

```typescript
// register — 표준 HTML 요소
<TextField {...form.register('name')} />

// Controller — TDS 컴포넌트 (Select, DatePicker 등)
<Controller
  name="van"
  control={control}
  render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      {options}
    </Select>
  )}
/>
```

### TDS 컴포넌트별 연결 방식

| TDS 컴포넌트 | 연결 방식 |
|-------------|----------|
| TextField | `register` spread |
| Select | Controller + `onValueChange={field.onChange}` |
| RadioGroup | Controller + `onChange={() => field.onChange(value)}` |
| DatePicker | Controller + Date 객체 직접 관리 |
| TextFieldClearable | Controller + `format.transform/reset` |
| Autocomplete | Controller + debounce 검색 + ID 동기화 |

---

## watch / setValue / getValues

```typescript
// watch: 리렌더링 O, 실시간 반응
const password = form.watch('password');

// setValue: 프로그래매틱 변경
setValue('address', result.address, { shouldValidate: true });
// shouldValidate: 즉시 검증 | shouldDirty: dirty 추적

// getValues: 리렌더링 X, 단순 읽기
const allValues = form.getValues();
```

---

## FormProvider + useFormContext

중첩 컴포넌트에서 prop drilling 방지. 단일 컴포넌트면 불필요.

```typescript
// 부모
<FormProvider {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <SearchAddressField />
  </form>
</FormProvider>

// 자식
function SearchAddressField() {
  const { setValue } = useFormContext<MerchantEditForm>();
  const handleSearchComplete = (result: AddressInfo) => {
    setValue('address', result.address, { shouldValidate: true });
  };
}
```

---

## useFieldArray

동적 추가/삭제 리스트. **key={field.id} 필수** (index 금지).

```typescript
const { fields, append, remove } = useFieldArray({ control, name: 'vanCodes' });

{fields.map((field, index) => (
  <div key={field.id}>
    <Controller
      name={`vanCodes.${index}.vanType`}
      control={control}
      render={({ field }) => <Select {...field} />}
    />
    <Button disabled={fields.length <= 1} onClick={() => remove(index)}>삭제</Button>
  </div>
))}
<Button onClick={() => append({ vanType: '', code: '' })}>추가</Button>
```

---

## Zod 검증 패턴

### 기본

```typescript
const schema = z.object({
  name: z.string().min(1, '필수'),
  phone: z.string().regex(/^\d{8,12}$/, '형식 오류'),
});
const form = useForm({ resolver: zodResolver(schema) });
```

### 동적 스키마 (ts-pattern)

```typescript
function getSchema(van: Van) {
  return match(van)
    .with('NICE', () => TidOnlySchema)
    .with('KIS', () => KisSchema)
    .exhaustive();
}
const form = useForm({ resolver: zodResolver(getSchema(van)) as Resolver<FormData> });
```

### 스키마 분기 기준별 패턴

| 분기 기준 | 패턴 | 예시 |
|-----------|------|------|
| 외부 props만 | `zodResolver(getSchema(prop))` | VAN 타입별 스키마 |
| 폼 값만 | 고정 스키마 + `superRefine` | 청약 WorkLogForm |
| 외부 props + 폼 값 | resolver 안에서 동적 생성 + `mode: 'onChange'` | 주문서류 WorkLogForm |

---

## nullable Select 필드

Select처럼 "아직 선택 안 함" 상태가 필요한 필드는 `defaultValues: null`로 시작.

**nullable + superRefine (권장)**

```typescript
// 스키마
taskStatus: z.enum(STATUS_LIST).nullable(),
// superRefine에서 null 체크
if (data.taskStatus == null) {
  ctx.addIssue({ code: 'custom', path: ['taskStatus'], message: '필수' });
  return;
}

// defaultValues
defaultValues: { taskStatus: null }  // 타입 일치 ✅
```

- 장점: defaultValues 타입이 자연스럽게 일치
- 단점: 검증이 2곳 (스키마 타입 + superRefine)

---

## 서버 데이터 동기화 (reset)

`defaultValues`는 마운트 시에만 적용. mutation 후 refetch된 데이터 반영:

```typescript
const { data } = useSuspenseQuery(query.users());
const { control, handleSubmit, reset, formState: { isDirty, dirtyFields } } =
  useForm<FormValues>({ defaultValues: { items: data } });

// @note defaultValues는 초기 마운트 시에만 적용
useEffect(function syncFormWithServerData() {
  reset({ items: data });
}, [data, reset]);
```

---

## showErrors 패턴 (점진적 에러 표시)

제출 전까지 에러를 숨기고, 버튼 클릭 시 한번에 노출.

```typescript
function Form() {
  const [showErrors, setShowErrors] = useState(false);
  const form = useForm<FormFields>({ mode: 'onTouched' });

  const handleButtonClick = () => {
    const errors = validateRequiredFields(form.watch());
    if (is.nonEmptyArray(errors)) {
      setShowErrors(true);
      form.setFocus(errors[0]);
      return;
    }
    form.handleSubmit(data => mutation.mutate({ body: data }))();
  };
}
```

---

## 에러 처리

```typescript
// 필드 에러 표시
<TextField
  error={is.truthy(form.formState.errors.name)}
  bottomText={form.formState.errors.name?.message}
  {...form.register('name')}
/>

// 서버 에러 반영
form.setError('merchantName', { message: '중복된 가맹점' });

// dirtyFields로 변경분만 전송
const changed = data.items.filter((_, i) => dirtyFields.items?.[i]);
```

---

## DO / DON'T

**DO**
- FormProvider + useFormContext (prop drilling 방지)
- showErrors로 점진적 에러
- validation/formatting 함수 분리
- `type="button"` 커스텀 핸들러
- 에러 시 `setFocus()`

**DON'T**
- useState로 폼값 직접 관리
- Controller 남용 (register로 충분하면 register)
- 포맷팅된 값 저장
- 과도한 실시간 검증
- zodResolver 없이 수동 검증
