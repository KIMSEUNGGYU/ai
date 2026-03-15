# 실시간 검색 + Autocomplete 패턴

> 관련 규칙: `[DECL]` `[API]` `[COUP]`

사용자 입력에 따라 API를 호출하고 결과를 Autocomplete으로 표시하는 패턴.

## 핵심 구성요소

| 구성요소 | 역할 |
|---------|------|
| `useDebouncedValue` | 입력값 디바운싱 (불필요한 API 호출 방지) |
| `useQuery` | API 호출 및 캐싱 |
| `enabled` | 빈 값일 때 API 호출 방지 |
| `Autocomplete` | 검색 결과 UI |

---

## 1. 일반 (useState)

가장 기본적인 형태. 별도 폼 라이브러리 없이 사용.

### 예시 코드

```tsx
import { useQuery } from '@tanstack/react-query';
import { Autocomplete } from '@tds/desktop';
import { is } from '@tossteam/is';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { useState } from 'react';

function SearchAutocomplete() {
  // 1. 사용자 입력값 관리
  const [keyword, setKeyword] = useState('');

  // 2. 디바운싱 (300ms)
  const debouncedKeyword = useDebouncedValue(keyword, 300);

  // 3. API 호출
  const { data: results } = useQuery({
    ...searchQueryOptions.search({ keyword: debouncedKeyword }),
    enabled: is.nonEmptyString(debouncedKeyword),
  });

  return (
    <Autocomplete value={keyword} onValueChange={setKeyword}>
      <Autocomplete.FieldBoxTrigger clearable>
        <Autocomplete.Input
          placeholder="검색어 입력"
          value={keyword}
          onValueChange={setKeyword}
        />
      </Autocomplete.FieldBoxTrigger>
      <Autocomplete.Content align="fit-trigger">
        <Autocomplete.Empty />
        {results?.items?.map(item => (
          <Autocomplete.Option key={item.id} value={item.name} textValue={item.name}>
            {item.name}
          </Autocomplete.Option>
        ))}
      </Autocomplete.Content>
    </Autocomplete>
  );
}
```

### 참고 파일
- [ShipmentCreateModal.tsx](../../services/admin/src/pages/order-shipment/shipment/components/ShipmentCreateModal.tsx)

---

## 2. react-hook-form

폼 내에서 Autocomplete을 사용할 때. Controller와 함께 사용.

### 예시 코드

```tsx
import { useQuery } from '@tanstack/react-query';
import { Autocomplete } from '@tds/desktop';
import { is } from '@tossteam/is';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { Controller, useForm } from 'react-hook-form';

interface FormValues {
  productName: string;
}

function FormWithAutocomplete() {
  const form = useForm<FormValues>({
    defaultValues: { productName: '' },
  });

  // 1. form.watch로 값 관찰 (리렌더링 발생)
  const productName = form.watch('productName');

  // 2. 디바운싱
  const debouncedProductName = useDebouncedValue(productName, 300);

  // 3. API 호출
  const { data: products } = useQuery({
    ...productQueryOptions.search({ productName: debouncedProductName }),
    enabled: is.nonEmptyString(debouncedProductName),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="productName"
        control={form.control}
        render={({ field }) => (
          <Autocomplete value={field.value} onValueChange={field.onChange}>
            <Autocomplete.FieldBoxTrigger clearable>
              <Autocomplete.Input
                placeholder="품목명 검색"
                value={field.value}
                onValueChange={field.onChange}
              />
            </Autocomplete.FieldBoxTrigger>
            <Autocomplete.Content align="fit-trigger">
              <Autocomplete.Empty />
              {products?.items?.map(item => (
                <Autocomplete.Option key={item.id} value={item.name} textValue={item.name}>
                  {item.name}
                </Autocomplete.Option>
              ))}
            </Autocomplete.Content>
          </Autocomplete>
        )}
      />
    </form>
  );
}
```

### 참고 파일
- [ProductCreateForm.tsx](../../services/admin/src/pages/order-shipment/product/product-option/components/ProductOptionUpdateModal/components/ProductCreateForm.tsx)

---

## 3. 검색 트리거 ≠ 폼 저장값 (Name 검색 → ID 저장)

**Autocomplete 검색 API와 폼 저장값이 다른 패턴.**

| 구분 | 값 | 용도 |
|------|-----|------|
| API 요청 | `productName` (string) | 검색 트리거 |
| 폼 저장 | `productId` (number) | 서버 제출용 |

검색용 상태(useState)와 폼 데이터(react-hook-form)를 분리하여 관리.

### 사용 시나리오
- 품목명으로 검색 → 선택 → productId 저장
- 서버에는 ID만 전송 (name은 서버가 이미 알고 있음)

### 예시 코드

```tsx
import { useQuery } from '@tanstack/react-query';
import { Autocomplete } from '@tds/desktop';
import { is } from '@tossteam/is';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  productId: z.number(),  // ID만 저장
});

type FormValues = z.infer<typeof schema>;

function ProductSelectForm() {
  // 1. 검색용 상태 (UI용, 폼 데이터 아님)
  const [productName, setProductName] = useState('');
  const debouncedProductName = useDebouncedValue(productName, 300);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productId: undefined },
  });

  // 2. API 호출
  const { data: products } = useQuery({
    ...productQueryOptions.search({ productName: debouncedProductName }),
    enabled: is.nonEmptyString(debouncedProductName),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="productId"
        control={form.control}
        render={({ field }) => (
          <Autocomplete
            size="large"
            value={field.value?.toString() ?? undefined}
            onValueChange={value => {
              // 3. 빈 값 처리 (clearable 클릭 또는 입력 삭제 시)
              if (!value) {
                field.onChange(undefined);
                return;
              }

              // 4. string → number 변환
              const id = Number(value);
              if (Number.isNaN(id)) return;

              field.onChange(id);

              // 5. 선택된 항목의 이름을 input에 표시
              const selectedProduct = products?.products?.find(p => p.id === id);
              if (selectedProduct) {
                setProductName(selectedProduct.productName);
              }
            }}
          >
            <Autocomplete.FieldBoxTrigger clearable>
              <Autocomplete.Input
                placeholder="품목명 검색"
                value={productName}  // 검색용 상태
                onValueChange={setProductName}
              />
            </Autocomplete.FieldBoxTrigger>
            <Autocomplete.Content align="fit-trigger">
              <Autocomplete.Empty />
              {products?.products?.map(product => (
                <Autocomplete.Option
                  key={product.id}
                  value={product.id.toString()}  // ID를 value로
                  textValue={product.productName}
                >
                  {product.productName}
                </Autocomplete.Option>
              ))}
            </Autocomplete.Content>
          </Autocomplete>
        )}
      />
    </form>
  );
}
```

### 상태 분리 이유

| 상태 | 역할 | 저장 위치 |
|------|------|----------|
| `productName` | 검색/표시용 (UI) | useState |
| `productId` | 제출용 (데이터) | react-hook-form |

**왜 분리하는가:**
1. 검색어는 폼 데이터가 아님 - 서버에 보내지 않음
2. 서버는 ID만 필요 - name은 서버가 이미 알고 있음
3. 검색 중인 값 ≠ 선택된 값 - 상태가 다름

### 데이터 흐름

```
사용자 입력 "품목"
    ↓
setProductName("품목") → debounce → API 호출
    ↓
목록에서 "품목A" 선택
    ↓
onValueChange("123")  ← Option의 value (id.toString())
    ↓
field.onChange(123)   ← form에 number로 저장
    ↓
setProductName("품목A") ← input에 선택된 이름 표시
    ↓
폼 제출 → { productId: 123 }
```

### 참고 파일
- [ProductCreateForm.tsx](../../services/admin/src/pages/order-shipment/product/product-option/components/ProductOptionUpdateModal/components/ProductCreateForm.tsx)

---

## watch vs useWatch

같은 컴포넌트 내에서는 차이 없음. **컴포넌트 분리 시 useWatch 사용**.

| | `form.watch` | `useWatch` |
|---|---|---|
| 형태 | 메서드 | 훅 |
| 사용 위치 | useForm 있는 컴포넌트만 | 어디서든 (control 전달) |
| 자식 컴포넌트 | props로 값 전달 필요 | control만 전달하면 됨 |

### 컴포넌트 분리 시

```tsx
// ProductNameAutocomplete.tsx (분리된 컴포넌트)
import { useWatch, Controller, Control } from 'react-hook-form';

interface Props {
  control: Control<FormValues>;
}

function ProductNameAutocomplete({ control }: Props) {
  // useWatch로 값 구독
  const productName = useWatch({ control, name: 'productName' });
  const debouncedProductName = useDebouncedValue(productName, 300);

  const { data: products } = useQuery({
    ...productQueryOptions.search({ productName: debouncedProductName }),
    enabled: is.nonEmptyString(debouncedProductName),
  });

  return (
    <Controller
      name="productName"
      control={control}
      render={({ field }) => (
        <Autocomplete value={field.value} onValueChange={field.onChange}>
          {/* ... */}
        </Autocomplete>
      )}
    />
  );
}

// 부모 컴포넌트
function ParentForm() {
  const form = useForm<FormValues>();

  return (
    <form>
      <ProductNameAutocomplete control={form.control} />
    </form>
  );
}
```

**장점**: 타이핑 시 `ProductNameAutocomplete`만 리렌더링. 다른 필드는 영향 없음.

---

## UX 개선 옵션

```tsx
import { keepPreviousData } from '@tanstack/react-query';

const { data: products } = useQuery({
  ...productQueryOptions.search({ productName: debouncedProductName }),
  enabled: is.nonEmptyString(debouncedProductName),
  staleTime: 1000 * 60 * 5,           // 동일 검색어 5분 캐싱
  placeholderData: keepPreviousData,  // 검색 중 이전 결과 유지
});
```

| 옵션 | 효과 |
|------|------|
| `staleTime` | 같은 검색어 재입력 시 API 호출 안 함 |
| `placeholderData: keepPreviousData` | 새 검색어 입력 중 목록이 깜빡이지 않음 |

---

## 주의사항

1. **Autocomplete.Input에 value/onValueChange 필수**
   ```tsx
   // Bad - 입력값이 반영 안 됨
   <Autocomplete.Input placeholder="검색" />

   // Good
   <Autocomplete.Input placeholder="검색" value={value} onValueChange={onChange} />
   ```

2. **리렌더링은 피할 수 없음**
   - 실시간 검색 = 값 변경마다 반응 = 리렌더링 필수
   - 성능 이슈 체감 시 컴포넌트 분리로 범위 축소

3. **디바운스 시간**
   - 일반적으로 300ms 권장
   - 타이핑 속도와 API 응답 시간에 따라 조절
