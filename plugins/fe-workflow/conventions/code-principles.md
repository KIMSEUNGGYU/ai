# 코드 원칙

> 변경에 용이한 코드 작성을 위한 원칙과 패턴

---

## 리뷰 마인드셋

### 코드 보기 전 먼저 생각하기

```
❌ 바로 코드 보기 → 끌려들어감 → 납득 → 리뷰할 게 없음
✅ "나라면 어떻게?" 먼저 생각 → 비교하며 리뷰
```

### use 훅은 콘센트다

`use`로 시작하는 것들(useState, useQuery)은 제약이 많다. 방 공사할 때 콘센트 위치를 먼저 고민하듯, 상태 위치를 먼저 설계해야 나중에 대공사를 안 한다.

### 디자이너 머릿속 따라가기

변경 요청은 디자인 단위로 온다. 컴포넌트도 그 단위로 나누면 변경이 한 곳에서 끝난다:

```tsx
// ❌ 천재적 추상화 — "카드만 버튼 추가" 시 분기 복잡도 증가
<StyledTextRow isExcluded={...} category={...} />

// ✅ 디자이너 사고방식 = 변경 단위
<CardConsumptionRow />
<AccountConsumptionRow />
<EtcConsumptionRow />
<RefundConsumptionRow />
```

---

## 최상위 원칙: 변경 용이성

> 한 가지 변경은 한 곳에서만 수정되어야 한다.

### 규칙

- 같은 값(URL, 문자열, 숫자)이 2곳 이상 → 상수/함수로 추출
- API 경로, 라우트 경로 → 한 곳에서 정의하고 import
- 타입 정의는 원본 1곳, 사용처는 원본에서 파생 (`Pick`, `Omit`, `Detail['field']`)
- 매직 넘버/문자열 금지 → 이름 있는 상수로

### 예시

```typescript
// ❌ URL이 3곳에 하드코딩 → 변경 시 3곳 수정
<Link to="/user/detail/123">상세보기</Link>
<Link to="/user/detail/456">편집</Link>
navigate(`/user/detail/${id}`)

// ✅ 한 곳에서 정의 → 변경 시 1곳 수정
export const ROUTES = {
  userDetail: (id: string) => `/user/detail/${id}`,
}

<Link to={ROUTES.userDetail('123')}>상세보기</Link>
navigate(ROUTES.userDetail(id))
```

```typescript
// ❌ 타입을 각각 정의 → 필드 추가 시 여러 곳 수정
interface UserListItem { id: string; name: string; }
interface UserDetail { id: string; name: string; email: string; }

// ✅ 기준 타입에서 파생 → 원본만 수정하면 됨
interface User { id: string; name: string; email: string; }
type UserListItem = Omit<User, 'email'>;
```

---

## 1. SSOT (Single Source of Truth)

> 정의는 한 곳, 사용처는 import/파생으로.

### 규칙

- Props 타입은 DTO에서 직접 추출 (`Detail['field']`, `NonNullable<>`)
- 같은 인터페이스를 여러 파일에서 재정의 금지 → 원본 import
- enum/상수 값은 한 곳에서 정의, 사용처에서 import
- Zod 스키마 → `z.infer<>`로 타입 파생 (타입 별도 정의 금지)
- 비즈니스 로직(계산, 판별)은 한 곳에서 정의, 사용처에서 호출

### 예시

```typescript
// ❌ Props 타입을 직접 정의 → DTO 변경 시 Props도 수정 필요
interface Props {
  id: number;
  name: string;
  vanSettings: VanSetting[];
}

// ✅ DTO에서 직접 추출 → DTO만 수정하면 됨
interface Props {
  van: Van;
  vanSettings: NonNullable<MerchantDetail['vanSettings']>;
}
```

```typescript
// ❌ 비즈니스 로직이 각 사용처에서 중복 정의
function MerchantBadge({ merchant }: Props) {
  const isActive = merchant.status === 'active' && merchant.contractEndDate > new Date();
  return <Badge>{isActive ? '활성' : '비활성'}</Badge>;
}

function MerchantRow({ merchant }: Props) {
  const isActive = merchant.status === 'active' && merchant.contractEndDate > new Date();
  return <TableRow css={{ opacity: isActive ? 1 : 0.5 }}>...</TableRow>;
}

// ✅ 판별 로직을 한 곳에서 정의, 사용처에서 호출
function getIsActiveMerchant(merchant: Merchant): boolean {
  return merchant.status === 'active' && merchant.contractEndDate > new Date();
}

function MerchantBadge({ merchant }: Props) {
  return <Badge>{getIsActiveMerchant(merchant) ? '활성' : '비활성'}</Badge>;
}

function MerchantRow({ merchant }: Props) {
  return <TableRow css={{ opacity: getIsActiveMerchant(merchant) ? 1 : 0.5 }}>...</TableRow>;
}
```

---

## 2. SRP (단일 책임 원칙)

> 모듈은 한 가지 변경 이유만 갖는다.

### 규칙

- 컴포넌트: UI 렌더링만. 데이터 페칭/로딩/에러는 상위(Suspense, ErrorBoundary)로 위임
- 훅: 하나의 관심사만 (필터 관리, 데이터 조회, UI 상태 중 하나)
- remote 함수: 네트워크 호출만. 비즈니스 로직/UI 피드백 포함 금지
- mutationOptions: 캐시 무효화만. toast/네비게이션은 컴포넌트에서 처리

### 예시

```typescript
// ❌ "분리"만 한 훅 — 접어놓고 깔끔하다는 착각
// 월 선택, 데이터 조회, 네비게이션 3가지 책임이 한 훅에
function useConsumptionPage() {
  const [month, setMonth] = useState(new Date());
  const { data, isError, refetch } = useQuery(consumptionQuery.list(month));
  const goPrevMonth = () => setMonth(subMonths(month, 1));
  const goNextMonth = () => setMonth(addMonths(month, 1));
  return { month, data, isError, refetch, goPrevMonth, goNextMonth };
}

// ✅ 관심사별 분리 — 각각 변경 이유가 하나
// 월 선택 UI → MonthSelector 컴포넌트
<MonthSelector value={month} onChange={setMonth} />
// 데이터 조회 → queryOptions
const { data } = useSuspenseQuery(consumptionQuery.list(month));
```

```typescript
// ❌ 훅 이름과 책임 불일치 — 이름은 "상품"인데 선택/필터까지
const { selectedProduct, handleSelectProduct, filterSavingsProducts } =
  useSavingsProducts(savingsProducts, monthlyPayment, term);

// ✅ 이름 = 책임 — 각 훅이 하나의 관심사만
const { filters } = useSavingFilters();
const { selectedProduct, handleSelect } = useProductSelection();
```

---

## 3. 응집도 ↑ 결합도 ↓

> 함께 바뀌는 것끼리 가까이, 외부 의존은 명시적으로.

### 상태 관리 우선순위

| 순위 | 종류 | 사용 시점 |
|------|------|-----------|
| 1 | 지역 상태 | 기본값. 최대한 버티기 |
| 2 | 서버 상태 | 데이터 페칭 (React Query) |
| 3 | 전역 상태 | 정말 필요할 때만 |

### 규칙

- 관련 코드끼리 가까이 배치 (A-B-A-B 분산 금지)
- 재사용 전까지 같은 파일 내에 정의 (이른 파일 추출 금지)
- 폴더 구조는 지역성 기반 — 사용되는 곳 가까이 (→ `folder-structure.md` 참조)
- 전역 상태보다 명시적 props 선호 (숨겨진 결합도 방지)

### 예시

```typescript
// ❌ A-B-A-B 패턴 — 관련 로직이 분산
const month = useState(new Date());       // A: 월 선택
const { data } = useQuery(...);           // B: 데이터 조회
const goPrevMonth = () => {};             // A: 월 선택
const isError = data?.error;              // B: 데이터 조회

// ✅ 관련된 것끼리 묶음
<MonthSelector value={month} onChange={setMonth} />       // A: 월 선택 완결
<ConsumptionList month={month} />                         // B: 내부에서 조회 처리
```

```typescript
// ❌ 전역 상태 = 숨겨진 결합도 (어디서 변경되는지 모름)
function useConsumption() {
  const month = useAtom(monthAtom); // 숨겨진 의존성
  return useQuery(consumptionQuery.list(month));
}

// ✅ 명시적 의존 — 의존 관계가 보임
function useConsumption(month: Date) {
  return useQuery(consumptionQuery.list(month));
}
```

---

## 4. 선언적 프로그래밍

> What(무엇을) 선언, How(어떻게)는 하위로 위임.

### 규칙

- 로딩/에러는 Suspense/ErrorBoundary에 위임, 컴포넌트는 데이터 렌더링만
- 조건문은 의도를 드러내는 함수로 추출 (How → What)
- 요구사항이 코드에 그대로 보여야 함

### 예시

```typescript
// ❌ 절차적: 로딩/에러를 직접 처리
function UserProfile() {
  const { data, isLoading, error } = useQuery(...);
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;
  return <div>{data.name}</div>;
}

// ✅ 선언적: 로딩/에러 위임, 데이터만 처리
<ErrorBoundary fallback={<ErrorMessage />}>
  <Suspense fallback={<Spinner />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>

function UserProfile() {
  const { data } = useSuspenseQuery(...);
  return <div>{data.name}</div>;
}
```

```typescript
// ❌ How: 조건의 구현이 노출됨
if (product.minMonthlyAmount <= monthlyPayment &&
    monthlyPayment <= product.maxMonthlyAmount &&
    product.availableTerms.includes(term)) {
  // ...
}

// ✅ What: 의도만 드러남
if (isEligibleProduct(product, { monthlyPayment, term })) {
  // ...
}
```

```typescript
// ❌ 요구사항 "일자별로 그루핑해서 출력"이 코드에서 안 보임
data.map(item => ({
  date: new Date(item.timestamp).toISOString().split('T')[0],
  ...item
})).reduce((acc, item) => { /* ... */ })

// ✅ 요구사항이 코드에 그대로 보임
const groupedByDate = groupByDate(consumptions);
```

---

## 5. 추상화

> 분리 ≠ 추상화. 리프부터 추상화.

### 규칙

- 한 함수/컴포넌트 안에는 같은 추상화 레벨만 유지
- 추상화 순서: 펼치기 → 관찰 → 리프부터 추상화
- 무지성 커스텀 훅 = 분리일 뿐, 추상화가 아님

### 예시

```typescript
// ❌ 분리만 한 것 — 접어놓고 깔끔하다는 착각
// 수정하려면 훅 열어서 내부를 다 봐야 함
function useConsumptionPage() {
  const [month, setMonth] = useState();
  const { data, isError, refetch } = useQuery(...);
  const goPrevMonth = () => {};
  const goNextMonth = () => {};
  return { month, data, isError, refetch, goPrevMonth, goNextMonth };
}

// ✅ 진짜 추상화 — 사용처도 깔끔, 내부도 깔끔
<MonthSelector value={month} onChange={setMonth} />
```

```typescript
// ❌ 레벨 혼재 — 고수준(UI 조립)과 저수준(필터링 로직)이 섞임
function ProductList({ products, monthlyPayment, term }: Props) {
  const filtered = products
    .filter(p => p.minMonthlyAmount <= monthlyPayment && monthlyPayment <= p.maxMonthlyAmount)
    .filter(p => p.availableTerms.includes(term))
    .sort((a, b) => b.annualRate - a.annualRate);

  return filtered.map(p => <ProductItem key={p.id} product={p} />);
}

// ✅ 같은 레벨 유지 — 비즈니스 로직은 아래로 위임
function ProductList({ products, monthlyPayment, term }: Props) {
  const filtered = filterEligibleProducts(products, { monthlyPayment, term });
  return filtered.map(p => <ProductItem key={p.id} product={p} />);
}
```

---

## 6. 가독성

> 의도가 명확하고, 코드를 읽으면 UI가 그려지는 코드.

### 규칙

- 변수명/함수명이 의도를 드러낸다
- 조기 반환(early return)으로 예외 케이스 먼저 처리
- 컴포넌트 인터페이스는 HTML처럼 뻔하게 (최소 놀람 원칙)
- 코드와 UI가 1:1 매핑 — 코드를 읽으면 화면이 보여야 함
- 위에서 아래로 읽히는 구조 — 고수준(컴포넌트 조립) → 저수준(헬퍼/유틸) 순서

### 예시

```typescript
// ❌ 처음 보는 인터페이스 — Props를 열어봐야 동작 파악
<NavigationSection
  currentMonth={month}
  setCurrentMonth={setMonth}
  goPrevMonth={...}
  goNextMonth={...}
/>

// ✅ HTML처럼 뻔한 인터페이스 — <select>와 동일한 멘탈 모델
<MonthSelector value={month} onChange={(value) => setMonth(value)} />
```

```typescript
// ❌ UI가 코드에서 안 보임 — SavingsCalculatorContents가 뭘 보여주는지 모름
<SavingFilterForm control={form.control} />
<SavingsCalculatorContents targetAmount={targetAmount} monthlyPayment={monthlyPayment} term={term} />

// ✅ UI와 코드 1:1 — 입력 필드, 탭 구조가 코드에서 바로 보임
<CurrencyTextField label="목표 금액" value={targetAmount} onChange={...} />
<CurrencyTextField label="월 납입액" value={monthlyPayment} onChange={...} />
<Tab defaultValue={TAB.products}>
  <Tab.Item value={TAB.products}>적금 상품</Tab.Item>
  <Tab.Item value={TAB.results}>계산 결과</Tab.Item>
</Tab>
```

---

## 7. 의존성

> 재사용 컴포넌트는 특정 라이브러리에 직접 의존하지 않는다.

### 규칙

- 재사용 컴포넌트: 특정 라이브러리(react-hook-form, zustand 등)에 직접 의존 금지 → prop으로 주입
- 페이지/도메인 컴포넌트: 라이브러리 직접 사용 허용 (과도한 래핑 금지)
- 외부 라이브러리 래핑 레이어는 실제 교체가 발생할 때 도입

### 예시

```typescript
// ❌ 재사용 컴포넌트가 react-hook-form에 직접 의존
function FormField({ name }: Props) {
  const { register } = useFormContext();
  return <input {...register(name)} />;
}

// ✅ prop으로 주입 — form 라이브러리와 무관하게 재사용 가능
function FormField({ value, onChange }: Props) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}
```

---

## 8. 인지 부하 제한

> 한 번에 파악할 수 있는 범위를 제한한다. (가이드라인)

| 제한 | 기준 |
|------|------|
| 함수 길이 | ≤ 30줄 |
| 파라미터 수 | ≤ 3개 (넘으면 객체) |
| 분기 깊이 | ≤ 3단계 |

---

## 9. 타입 설계와 분기 전략

> 서버 string을 FE에서 다룰 때: 관계 기반 타입 정의 + 기획 구조에 맞는 분기.

### 타입 추출 규칙

- 같은 리터럴 유니온이 **2곳 이상** → `type`으로 추출
- 소스 데이터가 한글이면 union 값도 **한글 유지** (불필요한 영어 번역 금지)
- 서버 DTO(`models/`)에는 서버 타입만, FE 분류 타입은 **사용하는 파일에 정의**

```typescript
// ❌ 같은 리터럴 유니온을 여러 곳에서 반복
inspectionType?: '완료' | '반려';  // dto
inspectionType: '완료' | '반려';   // mutation params
Record<'완료' | '반려', 'green' | 'red'>  // component

// ✅ 타입 한 곳에서 정의, import해서 사용
export type InspectionType = '완료' | '반려';
```

### 서버 string → FE 분류 타입

서버가 `string`으로 내려주지만 FE에서 케이스별 분기가 필요할 때 → **변환 함수 한 곳에서 관리**

```typescript
// 페이지 파일 하단에 정의 (고수준 → 저수준 배치)
type AttachmentType = '수기 업로드' | '대표자 신분증' | '일반';

function getAttachmentType(labelName: string): AttachmentType {
  if (labelName === '수기 업로드') return '수기 업로드';
  if (labelName === '대표자 신분증') return '대표자 신분증';
  return '일반';
}
```

- 함수명: `get*` (분류/판별) — `to*`는 데이터 변환에만 사용
- 새 케이스 추가 시 이 함수 하나만 수정

### 배타적 분기: match + exhaustive

기획에서 케이스별로 **보여주는 것이 다를 때** → `match().exhaustive()`로 선언

```typescript
// ❌ 절차적 조건문 — 케이스 간 관계가 안 보임
const isManualUpload = current.labelName === '수기 업로드';
const isIdDocument = current.labelName === '대표자 신분증';
{isIdDocument ? <OcrInfoTable /> : null}
{!isManualUpload ? <InspectionRadio /> : null}

// ✅ 배타적 케이스를 match로 선언 — 기획 구조가 코드에 보임
{match(attachmentType)
  .with('수기 업로드', () => null)
  .with('대표자 신분증', () => (
    <>
      <OcrInfoTable />
      <InspectionRadio />
    </>
  ))
  .with('일반', () => <InspectionRadio />)
  .exhaustive()}
```

**판단 기준:**
- **배타적 분기** (A or B or C, 각각 보여주는 게 다름) → `match`
- **레이어 조합** (공통 기반 + 옵션 추가/제거) → 조건부 렌더링
- 기획이 "A는 X+Y, B는 X만"이면 → **컴포넌트 중복이 맞음** (X를 추출하려 하지 않음)

---

## 10. 상태 모델링: 플래그 조합 vs 판별 유니온

> 여러 boolean/nullable 플래그로 상태를 표현하지 말고, 판별 유니온으로 가능한 상태만 타입에 열거한다.

```typescript
// ❌ 플래그 조합 — 모순 상태 가능 (isLoading=true인데 data도 있음)
const [data, setData] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

// ✅ 판별 유니온 — 가능한 상태만 타입으로 표현
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

// switch(state.status)로 분기, exhaustive 체크로 누락 방지
```

**판단 기준:** 2개 이상의 상태값이 조합되어 분기를 만들고, 각 케이스에서 사용 가능한 데이터가 다르면 판별 유니온 적용. React Query의 useSuspenseQuery처럼 라이브러리가 이미 처리해주는 경우는 직접 모델링 불필요.

---

## 11. UI Optional → API Required: Type Guard 패턴

> UI Form에서는 nullable이지만 API 요청 시 필수인 필드를 `!`나 `as` 대신 Type Guard로 처리한다.

```typescript
// Form 타입: UI에서는 nullable
type FormData = { requiredField: string | null; optionalField?: string; };
// Submit 타입: API에서는 required
type SubmitData = { requiredField: string; optionalField?: string; };

// Type Guard
function isValidSubmit(data: FormData): data is SubmitData {
  return data.requiredField !== null;
}

// 사용
const handleSubmit = async (data: FormData) => {
  if (!isValidSubmit(data)) return;
  // data는 SubmitData — requiredField가 string으로 확정
  await apiCall({ field: data.requiredField }); // 타입 안전
};
```

---

## ✅ DO & ❌ DON'T

### ✅ DO
- 한 가지 변경 = 한 곳에서 끝 (SSOT)
- 함께 바뀌는 것끼리 가까이 (응집도)
- What 선언, How 위임 (선언적)
- 의도가 드러나는 이름, 조기 반환 (가독성)
- 분리 ≠ 추상화 — 사용처도 내부도 깔끔해져야 진짜 추상화

### ❌ DON'T
- 이른 추상화/일반화 ("나중에 필요할 것 같아서")
- 이른 파일 추출 (재사용 전까지 같은 파일 유지)
- 성급한 상수 추출 (여러 곳 사용 전까지 현재 위치)
- 과도한 에러 핸들링 (일어나지 않을 시나리오 대비)
- any 타입 사용

#### 이른 추상화 구체적 안티패턴

다음은 리뷰에서 자주 제안되지만, 오히려 코드를 악화시키는 패턴이다:

```typescript
// ❌ 1회용 인라인 문자열을 상수로 추출
// 사용처 바로 위에 있으면 괜찮지만, 파일 상단에 선언하면 시점 이동만 유발
const DELIVERY_TYPE = { AVAILABLE: '선출고 가능', UNAVAILABLE: '선출고 불가' } as const;
// ... (수십 줄의 다른 코드) ...
<Radio label={DELIVERY_TYPE.AVAILABLE} checked={field.value === DELIVERY_TYPE.AVAILABLE} />

// ✅ 인라인이 더 명확
<Radio label="선출고 가능" checked={field.value === '선출고 가능'} />
```

```tsx
// ❌ 단순 JSX 조각을 헬퍼 컴포넌트로 추출
// 실제 레이블 스타일이 여러 패턴(semibold/grey700, grey800, 아이콘 유무)일 때
// 헬퍼로 통합하면 원래 디자인 의도가 왜곡됨
function RequiredLabel({ children }) { return <><Txt>{children}</Txt><Icon name="dot-red" /></>; }

// ✅ 패턴이 다르면 인라인이 더 정확
<label><Txt fontWeight="semibold" color={grey700}>{name}</Txt><Icon name="dot-red" /></label>
<label><Txt color={grey800}>{name}</Txt><Icon name="dot-red" /></label>
```

```typescript
// ❌ 의도가 명확한 단순 표현식을 변수로 추출
const isSubmittable = form.formState.isValid && !isPending;
<Button disabled={!isSubmittable}>제출</Button>

// ✅ 인라인이 충분히 읽힘
<Button disabled={!form.formState.isValid || isPending}>제출</Button>
```

```typescript
// ❌ 1회 사용 변환 로직을 함수로 추출 — 시점 이동만 유발
function toPostDocumentParams(data: FormInput): PostParams {
  return { ...data, contacts: data.contact ? [data.contact] : undefined, files: [] };
}
await mutateAsync(toPostDocumentParams(data));

// ✅ 인라인이 흐름을 끊지 않음
await mutateAsync({
  ...data,
  contacts: data.contact ? [data.contact] : undefined,
  files: [],
});
```

> **판단 기준:** 추출했을 때 (1) 재사용되거나 (2) 복잡한 로직이 추상화되어 읽기 쉬워지는 경우에만 추출한다.
> 단순히 "분리"만 하는 추출은 오히려 시점 이동(indirection)으로 가독성을 해친다.

```tsx
// ❌ mutation + overlay 로직을 커스텀 훅으로 추출
// 훅 안에서 JSX(AlertDialog)를 렌더링 → 로직과 UI가 훅에 숨겨짐
// 수정하려면 훅 파일을 열어야 하고, 컴포넌트에서 동작이 안 보임
function useUrgentToggle(orderNo: string) {
  const mutation = useMutation(funnelDetailMutations.urgent());
  const handleToggle = async (isUrgent: boolean) => {
    if (isUrgent) { /* OFF 처리 */ return; }
    overlay.open(({ isOpen, close }) => (
      <AlertDialog onConfirm={async () => { await mutation.mutateAsync(...); close(); }} />
    ));
  };
  return { handleUrgentToggle: handleToggle };
}

// ✅ 컴포넌트에 인라인 — mutation + 핸들러 + overlay가 사용처에서 바로 보임
// 1회 사용이고, 컴포넌트의 UI 흐름 안에서 읽히는 게 더 명확
function OrderTabContent({ orderNo, item }: Props) {
  const urgentMutation = useMutation(funnelDetailMutations.urgent());
  const handleUrgentToggle = async () => { /* 바로 여기서 처리 */ };
  return <Table.Toggle onChange={handleUrgentToggle} />;
}
```

---

## 12. 자율적인 컴포넌트 (Self-Contained Component)

> 컴포넌트가 자신의 데이터를 직접 조회한다. 부모는 조립만.

부모가 데이터를 조회해서 props로 내려주면, 데이터 추가/변경 시 부모까지 수정해야 한다. 컴포넌트가 자신의 데이터를 직접 조회하면 변경이 해당 컴포넌트 안에서 끝난다:

```tsx
// ❌ 부모가 데이터 조회 + 분배 — 부모 책임 비대
function ReservationStatusPage() {
  const { data: rooms } = useSuspenseQuery(roomQuery.list());
  const { data: myReservations } = useSuspenseQuery(reservationQuery.myList());
  return <MyReservationList rooms={rooms} reservations={myReservations} />;
}

// ✅ 각 컴포넌트가 자신의 데이터를 직접 조회
function ReservationStatusPage() {
  return (
    <>
      <ReservationTimeline date={date} />
      <MyReservationList title="내 예약" onCancelSuccess={...} />
    </>
  );
}

function MyReservationList({ title, onCancelSuccess }: Props) {
  const { data: rooms } = useQuery(roomQuery.list());
  const { data: myReservations } = useQuery(reservationQuery.myList());
  // ... 렌더링
}
```

**판단 기준:** 컴포넌트가 표시하는 데이터가 해당 컴포넌트에서만 사용되면 직접 조회. 여러 형제가 같은 데이터를 공유해야 하면 부모에서 조회.

---

## 13. render prop으로 행동 주입

> 리스트의 각 항목에 대한 액션이 사용처마다 다를 때, render prop으로 주입하면 리스트 자체의 재사용성이 유지된다.

```tsx
interface MyReservationListProps {
  renderRight: (reservation: Reservation) => React.ReactNode;
}

function MyReservationList({ renderRight }: MyReservationListProps) {
  const { data: myReservations } = useQuery(reservationQuery.myList());
  return myReservations.map(reservation => (
    <ListRow
      contents={<ListRow.Text2Rows top={reservation.roomName} bottom={reservation.time} />}
      right={renderRight(reservation)}
    />
  ));
}

// 사용처에서 행동 주입
<MyReservationList
  renderRight={(reservation) => (
    <Button onClick={() => cancelMutation.mutateAsync(reservation.id)}>취소</Button>
  )}
/>
```

**판단 기준:** 데이터 표시는 동일하고 액션만 다를 때 사용. 표시까지 다르면 별도 컴포넌트가 맞음.

---

## 14. 도메인 모델 응집

> 엔티티의 스키마, 타입, 판별 함수, 검증 로직을 하나의 model 파일에 모은다. 정책 변경이 한 곳에서 끝남.

```typescript
// models/reservation.model.ts
export const ReservationSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  date: z.string(),
  start: z.string(),
  end: z.string(),
  attendees: z.number(),
});
export type Reservation = z.infer<typeof ReservationSchema>;

// 도메인 판별 함수도 같은 파일에
export function isTimeOverlapping(
  reservation: Reservation, startTime: string, endTime: string
): boolean {
  return reservation.start < endTime && reservation.end > startTime;
}
```

**판단 기준:** 스키마 + 타입만이면 models/(DTO)에 유지. 판별 함수나 검증 로직이 추가되면 model 파일로 응집.

---

## 15. onValueChange: 변환된 값 전달

> `onChange(event)` 대신 `onValueChange(parsedValue)`로 파싱된 값을 바로 전달하면, 사용처에서 변환 코드를 반복하지 않는다.

```tsx
// ❌ 사용처에서 매번 변환
<input type="number" onChange={e => setAttendees(Number(e.target.value))} />

// ✅ 컴포넌트가 변환 책임을 가짐
interface NumberFieldProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
}

function NumberField({ value, onValueChange, min, ...rest }: NumberFieldProps) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={e => onValueChange(Number(e.target.value))}
      {...rest}
    />
  );
}

// 사용처 — 깔끔
<NumberField value={attendees} onValueChange={setAttendees} min={1} />
```

**판단 기준:** `onChange(event)`는 이벤트 객체 자체가 필요할 때, `onValueChange(value)`는 파싱된 값만 필요할 때. 재사용 컴포넌트라면 `onValueChange` 선호.

---

## 16. Suspense/Error fallback을 정적 속성으로 부착

> Loading/Error fallback이 해당 컴포넌트와 밀접할 때, 정적 속성으로 부착하면 한 import에서 함께 사용 가능.

```tsx
function Timeline({ date }: { date: string }) {
  const { data: rooms } = useSuspenseQuery(roomQuery.list());
  // ... 렌더링
}

Timeline.Loading = () => <div>예약 현황을 불러오는 중...</div>;
Timeline.Error = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div>
    <span>{error.message}</span>
    <Button onClick={resetErrorBoundary}>재시도</Button>
  </div>
);

// 사용처 — 관련 코드가 한 곳에서 import
<ErrorBoundary FallbackComponent={Timeline.Error}>
  <Suspense fallback={<Timeline.Loading />}>
    <Timeline date={date} />
  </Suspense>
</ErrorBoundary>
```

**판단 기준:** fallback이 해당 컴포넌트의 도메인/UI와 밀접하면 정적 속성. 범용 fallback(전체 화면 로딩 등)은 별도 컴포넌트.

---

## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2026-02-08 | 초판 (best-code 소스 기반) |
| 2026-02-27 | 이른 추상화 구체적 안티패턴 4가지 추가 (ISH-1229 리뷰 학습) |
| 2026-03-04 | mutation+overlay 훅 추출 안티패턴 추가 (ISH-1261 리뷰 학습) |
| 2026-03-07 | §9 타입 설계와 분기 전략 추가 — 리터럴 union 추출, 서버 string→FE 분류, match vs 조건부 렌더링 판단 기준 (ISH-1266 리뷰 학습) |
| 2026-04-04 | §10 플래그 조합 vs 판별 유니온, §11 UI Optional→API Required Type Guard 추가 |
| 2026-04-04 | §12~§16 추가 — 자율적인 컴포넌트, render prop, 도메인 모델 응집, onValueChange, Suspense fallback 정적 속성 (Toss 모의고사 PR 학습) |
