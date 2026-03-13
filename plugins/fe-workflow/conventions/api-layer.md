# API 계층 컨벤션

> API 호출부터 캐싱, 타입 정의까지의 패턴과 규칙

---

## 1. Remotes (API 함수)

> 순수 네트워크 호출만. 비즈니스 로직/UI 피드백 포함 금지.

### 규칙

- API 호출은 httpClient를 통해서만 (직접 fetch/ky 호출 금지)
- 순수 네트워크 호출만. 비즈니스 로직/UI 피드백 포함 금지

### 네이밍

| Prefix | HTTP Method | 예시 |
|--------|-------------|------|
| `fetch` | GET | `fetchMerchantDetail` |
| `post` | POST | `postMerchant` |
| `update` | PUT/PATCH | `updateMerchant` |
| `delete` | DELETE | `deleteTid` |

### 파라미터/응답: 항상 DTO 타입 사용

```typescript
// ✅ *Params, *Response 타입으로 정의
export const fetchMerchantDetail = (params: FetchMerchantDetailParams) => {
  return httpClient.get<FetchMerchantDetailResponse>(`merchants/${params.merchantId}`);
};

export const updateMerchant = (params: UpdateMerchantParams) => {
  const { merchantId, ...payload } = params;
  return httpClient.patch(`merchants/${merchantId}`, { json: payload });
};

// ❌ 인라인 타입, 개별 인자
export const fetchMerchantDetail = (merchantId: string) => { ... };
// ❌ 제네릭에 인라인 타입
httpClient.get<{ items: Merchant[] }>(...);
```

### 공통 페이지네이션 타입

```typescript
// lib/types/pagination.ts
/** Cursor 기반 무한 스크롤 페이지네이션 파라미터 */
export interface CursorPaginationParams {
  cursor?: number;
  limit?: number;
}

export interface CursorPaginationResponse<T> {
  cursor?: number;
  items: T[];
}
```

### SearchParamsBuilder (GET 리스트)

```typescript
// models/branch.dto.ts
interface FetchBranchListParams extends CursorPaginationParams {
  filters: BranchFilters;
}

// remotes/branch.ts
export const fetchBranchList = (params: FetchBranchListParams) => {
  const { filters, cursor } = params;
  const searchParams = new SearchParamsBuilder()
    .append('search', filters.search ?? '')
    .appendArray('van', filters.van)
    .append('cursor', cursor?.toString() ?? '')
    .build();

  return httpClient.get<CursorPaginationResponse<Branch>>('agencies', { searchParams });
};
```

---

## 2. Queries

> queryOptions 팩토리 패턴. queryKey는 계층적으로 수동 관리.

### queryOptions 패턴

```typescript
// queries/merchant.query.ts
const merchantKeys = {
  all: ['merchant'] as const,
  list: (filters: MerchantFilters) => [...merchantKeys.all, 'list', filters] as const,
  infinite: (filters: MerchantFilters) => [...merchantKeys.all, 'infinite', filters] as const,
  detail: (merchantId: string) => [...merchantKeys.all, 'detail', merchantId] as const,
};

export const merchantQuery = {
  list: (filters: MerchantFilters) =>
    queryOptions({
      queryKey: merchantKeys.list(filters),
      queryFn: () => fetchMerchantList({ filters }),
    }),
  infinite: (filters: MerchantFilters) =>
    infiniteQueryOptions({
      queryKey: merchantKeys.infinite(filters),
      queryFn: ({ pageParam }) =>
        fetchMerchantList({ filters, cursor: pageParam }),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) => lastPage?.cursor,
    }),
  detail: (merchantId: string) =>
    queryOptions({
      queryKey: merchantKeys.detail(merchantId),
      queryFn: () => fetchMerchantDetail({ merchantId }),
    }),
};
```

### queryKey 규칙

- `as const`로 타입 보존
- 계층적 구조: `['domain', 'action', params]`
- list: 일반 API 조회, infinite: 커서 기반 페이지네이션 → queryKey 분리하여 독립 invalidate

### staleTime / gcTime (필요 시)

```typescript
// 자주 바뀌지 않는 데이터에만 staleTime 설정
queryOptions({
  queryKey: merchantKeys.statusList(),
  queryFn: fetchMerchantStatusList,
  staleTime: 24 * 60 * 60 * 1000, // 1일간 fresh
});
```

| 옵션 | 역할 |
|------|------|
| staleTime | 데이터 신선도 기준. 이 시간 내엔 refetch 안 함. 기본값 0 |
| gcTime | 메모리 캐시 유지 시간. unmount 후에도 캐시 유지 |

### normalizeFilters (배열 필터 캐시 효율)

```typescript
// 배열 필터의 순서 차이로 인한 캐시 미스 방지
queryOptions({
  queryKey: ['tasks', 'list', normalizeFilters(filters, ['status', 'assignee'])],
  queryFn: () => getTaskList(filters),
});
```

- 배열 정렬(`['DONE', 'TODO']` = `['TODO', 'DONE']`) → 중복 캐시 방지

### Suspense 패턴

```typescript
// 기본: useSuspenseQuery (데이터 존재 보장)
function Content() {
  const { data } = useSuspenseQuery(merchantQuery.detail(merchantId));
  return <div>{data.name}</div>; // data는 항상 존재
}

// 상위에서 래핑
<ErrorBoundary fallback={<ErrorView />}>
  <Suspense fallback={<Loading />}>
    <Content />
  </Suspense>
</ErrorBoundary>
```

**useQuery가 필요한 경우:**
- `placeholderData: keepPreviousData` — 페이지 전환 시 깜빡임 방지
- 무한스크롤 — `isFetchingNextPage`로 부분 로딩 표시

---

## 3. Mutations

> mutationOptions에서 캐시 무효화만. toast/네비게이션은 컴포넌트에서.

### mutationOptions 팩토리

```typescript
// mutations/merchant.mutation.ts
import { queryClient } from 'lib/queryClient';

export const merchantMutation = {
  create: () =>
    mutationOptions({
      mutationFn: postMerchant,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: merchantKeys.all });
      },
    }),
  update: () =>
    mutationOptions({
      mutationFn: updateMerchant,
      onSuccess: (_, params) => {
        queryClient.invalidateQueries({ queryKey: merchantKeys.detail(params.merchantId) });
      },
    }),
};
```

### 컴포넌트에서 사용: mutateAsync + try-catch

```typescript
const { mutateAsync: createMerchant } = useMutation(merchantMutation.create());

const handleSubmit = async (formData: CreateMerchantFormData) => {
  try {
    await createMerchant(formData);
    showSuccessToast('등록 완료');
  } catch (error) {
    showErrorToast(error);
  }
};
```

### 규칙

- **mutateAsync 선호** — mutate는 콜백 패턴(`onSuccess`/`onError`)으로 가독성 저하
- **invalidateQueries**: mutationOptions의 `onSuccess`에서 처리
- **에러 처리**: 컴포넌트의 try-catch에서 처리
- **UI 피드백** (toast 등): 컴포넌트에서 처리

---

## 4. 타입 정의

> 서버 타입(models/)과 클라이언트 타입(types/)을 분리한다.

### interface vs type

- **interface 기본**: API 응답, 엔티티, 파라미터, 객체 형태
- **type**: union, intersection 필요할 때만

```typescript
// ✅ interface: 서버 DTO, 엔티티
interface MerchantDetail {
  id: number;
  name: string;
  van: Van;
}

// ✅ type: 판별 유니온
type TidRegistrationForm =
  | { van: 'NICE'; data: TidOnlyForm }
  | { van: 'KIS'; data: KisForm };
```

### 서버 타입 (models/)

**파일 단위:** 도메인별 한 파일 (`[domain].dto.ts`)

**파일 내 순서:** 공통 타입 → Params/Response/엔티티 순서. 엔드포인트 주석(`// ── GET /path ──`) 불필요 — 타입 이름(`Fetch*Params`, `Post*Params`)이 이미 엔드포인트를 나타냄.

```typescript
// models/merchant.dto.ts

type MerchantStatus = 'active' | 'inactive';

interface FetchMerchantListParams extends CursorPaginationParams {
  filters: MerchantFilters;
}

interface MerchantListItem {
  /** 가맹점 ID */
  id: number;
  /** 가맹점명 */
  name: string;
  /** 가맹점 상태 */
  status: MerchantStatus;
}

interface MerchantListResponse extends CursorPaginationResponse<MerchantListItem> {
  /** 전체 가맹점 수 */
  totalCount: number;
}

interface FetchMerchantDetailParams {
  /** 가맹점 ID */
  merchantId: string;
}

interface MerchantDetail {
  /** 가맹점 ID */
  id: number;
  /** 가맹점명 */
  name: string;
  /** 사업자번호 (10자리) */
  businessNumber: string;
  /** VAN사 */
  van: Van;
}

interface CreateMerchantParams {
  /** 가맹점명 */
  name: string;
  /** 사업자번호 (10자리) */
  businessNumber: string;
}

interface UpdateMerchantParams {
  /** 가맹점 ID */
  merchantId: string;
  /** 가맹점명 */
  name?: string;
}
```

### 파생 규칙

- 스키마가 겹치면 → `Omit`/`Pick`/`NonNullable`로 파생
- 스키마가 다르면 (List ≠ Detail) → 각각 독립 정의

```typescript
// ✅ 스키마 겹침 → 파생
type MerchantListItem = Pick<MerchantDetail, 'id' | 'name' | 'van'>;
type VanSetting = NonNullable<MerchantDetail['vanSettings']>[number];

// ✅ 스키마 다름 → 독립 정의
interface MerchantListItem { ... }   // List API 전용 스키마
interface MerchantDetail { ... }     // Detail API 전용 스키마
```

### 네이밍

| 용도 | 패턴 | 예시 |
|------|------|------|
| 조회 요청 | `Fetch*Params` | `FetchMerchantDetailParams` |
| POST | `Post*Params` | `PostMerchantParams` |
| PUT/PATCH | `Update*Params` | `UpdateMerchantParams` |
| DELETE | `Delete*Params` | `DeleteTidParams` |
| 응답 | `*Response` | `MerchantListResponse` |
| 엔티티 | 명사 | `MerchantDetail`, `MerchantListItem` |

> `*Params` 타입은 remotes 네이밍을 따른다. Queries/Mutations 팩토리 **메서드명**만 유의미한 이름 사용 가능 (예: `create`, `update`).

### Zod 스키마 (types/)

```typescript
// types/merchant.schema.ts
const businessNumberSchema = z.string().length(10, '사업자번호 10자리');

export const createMerchantSchema = z.object({
  name: z.string().min(1, '필수'),
  businessNumber: businessNumberSchema,
});

// 타입은 스키마에서 파생 (별도 정의 금지)
export type CreateMerchantFormData = z.infer<typeof createMerchantSchema>;
```

### 유틸리티 타입 활용

```typescript
// 서버 응답에서 파생
type VanSetting = NonNullable<MerchantDetail['vanSettings']>[number];

// Pick/Omit
type MerchantListItem = Pick<MerchantDetail, 'id' | 'name' | 'van'>;
```

---

## 5. API 스펙 문서 (.ai/specs/api/)

> API 정의/사용 시 반드시 `.ai/specs/api/` 문서를 먼저 확인하고, 없으면 생성한다.

### 워크플로우

```
1. .ai/specs/api/{domain}.md 확인 → 해당 엔드포인트 있는지 탐색
2. 없으면 → 백엔드 확인 후 .ai/specs/api/{domain}.md에 추가
3. 스펙 문서 기반으로 DTO/Remote/Mutation 작성
```

### DTO 주석 규칙

DTO 속성에 **한글 JSDoc 주석**을 달아 필드의 의미를 명시한다. 백엔드 응답/요청의 필드명만으로 의미 파악이 어려운 경우가 많으므로, 각 속성에 `/** 설명 */` 주석을 추가한다.

```typescript
// models/funnel.dto.ts

interface FunnelOrderDetail {
  /** 주문 ID */
  orderId: number;
  /** 주문시각 */
  orderTs: string;
  /** 긴급 여부 */
  isUrgent: boolean;
  /** 구매 출처 */
  source: string;
  /** 주문번호 */
  orderNo: string;
  /** 주문자 이름 (마스킹) */
  ordererName: string;
  /** 주문자 전화번호 (마스킹) */
  ordererPhone: string;
  /** 구매 유형 (e.g. '온라인') */
  purchaseType?: string;
  /** 주문 상태 */
  status: string[];
  /** 제휴사 정보 (e.g. ['배달의민족']) */
  partners?: string[];
  /** 설치일 (e.g. '2021-01-15') */
  installDate?: string;
}
```

**규칙:**
- 모든 DTO 속성에 `/** */` JSDoc 주석 추가
- `id`, `name` 등 자명한 필드도 도메인 맥락 설명 (e.g. `/** 주문 ID */`)
- 값 형식이 특수하면 예시 포함 (e.g. `(e.g. '2021-01-15')`)
- 마스킹/가공 여부 명시 (e.g. `(마스킹)`)
- 엔드포인트 그룹 주석(`// ── GET /path ──`) 금지 — 타입 이름이 이미 역할을 나타냄

---

## 6. 개발 순서

API 관련 코드 작성 시 아래 순서로 정의한다.

```
0. .ai/specs/api/ → API 스펙 확인 (없으면 생성)
1. models/   → DTO 타입 정의 (Request/Response)
2. remotes/  → API 함수 정의 (httpClient 사용)
3. queries/  → queryOptions 정의 (조회)
   mutations/ → mutationOptions 정의 (변경)
4. types/    → 클라이언트 타입 + Zod 스키마 (필요 시)
```

---

## 7. 고급 패턴

### Prefetch

리스트 → 상세 전환 시 prefetch로 로딩 없는 전환:

```typescript
// 상세 페이지 진입 전 prefetch (리스트 페이지에서)
const handleRowClick = (merchantId: string) => {
  queryClient.prefetchQuery(merchantQuery.detail(merchantId));
  router.push(`/merchants/${merchantId}`);
};
```

### Optimistic Update (선택적)

즉각 UI 반영이 필요한 경우에만 사용:

```typescript
mutationOptions({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: todoKeys.all });
    const previous = queryClient.getQueryData(todoKeys.detail(newTodo.id));
    queryClient.setQueryData(todoKeys.detail(newTodo.id), newTodo);
    return { previous };
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(todoKeys.detail(newTodo.id), context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: todoKeys.all });
  },
});
```

---

## ✅ DO & ❌ DON'T

### ✅ DO
- remote 함수 파라미터는 항상 객체로 받기
- queryKey는 `as const`로 타입 보존
- mutationOptions의 onSuccess에서 invalidateQueries 처리
- mutateAsync + try-catch로 에러 처리
- 서버 타입(DTO)과 클라이언트 타입 분리
- 자주 안 바뀌는 데이터엔 staleTime 설정 고려
- normalizeFilters로 캐시 효율 관리
- useSuspenseQuery 기본 사용
- DTO 속성에 `/** 한글 설명 */` JSDoc 주석 추가

### ❌ DON'T
- remote 함수에서 개별 인자 받기
- queryKey를 문자열 하드코딩하기
- 컴포넌트에서 직접 queryClient.invalidateQueries 호출하기
- mutate + onSuccess/onError 콜백 패턴 사용하기
- 서버 응답 타입에 클라이언트 전용 필드 추가하기
- 정적 데이터에 staleTime 미설정 (불필요한 refetch 발생)

---

## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2025-02-05 | 초안 |
| 2026-02-08 | HttpClient 래퍼, staleTime, normalizeFilters, Suspense 추가 |
| 2026-02-08 | 톤 정리 — 폴더 구조 중복 제거, HttpClient 구현→규칙 축소, VO/SSR 제거, SearchParamsBuilder 추가, mutations 실제 패턴 반영 |
| 2026-03-04 | Prefetch, Optimistic Update 패턴 추가 |
| 2026-03-04 | DTO 속성 JSDoc 주석 규칙 추가, 섹션 번호 정리 |
| 2026-03-05 | staleTime 톤 다운 (필수 → 필요 시), DO/DON'T 조정 |
