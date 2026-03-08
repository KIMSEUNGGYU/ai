---
description: 백엔드 API를 프론트엔드 패턴에 맞춰 통합
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
argument-hint: @백엔드_API_폴더_경로
---

## 역할
백엔드 API 정의를 분석하고 프론트엔드 코드(DTO/remotes/mutations/페이지)를 자동 생성한다.

## 입력
- `$ARGUMENTS`: 백엔드 API 정의 폴더 경로 (예: `@.ai/i-agency-user`)
- 폴더 구조:
  ```
  .ai/backend-api/
    ├── controller.ts    # API 엔드포인트 정의
    ├── dtos/            # Request/Response DTO
    ├── service.ts       # 비즈니스 로직
    └── docs.ts          # API 문서
  ```

## 진행 단계

### Phase 1: 백엔드 API 분석
1. **controller 파일 읽기**
   - HTTP 메서드 (GET, POST, PUT, PATCH, DELETE)
   - 경로 (path params, query params)
   - Request body, Response 타입
   - 인증 요구사항

2. **DTO 파일 읽기**
   - Request DTO 필드와 타입
   - Response DTO 구조
   - 필수/선택 필드 구분
   - description 파악

3. **비즈니스 로직 파악** (service 파일)
   - 필수 필드 validation
   - 자동 생성 로직 (예: agencyCode)
   - 에러 케이스 (409 중복, 404 없음 등)

### Phase 1.5: API 스펙 문서 생성
1. **`.ai/specs/api/{domain}.md` 확인**
   - 해당 도메인 스펙 문서가 이미 있는지 확인
   - 있으면 → 새 엔드포인트만 추가
   - 없으면 → 새 파일 생성

2. **스펙 문서 작성**
   - Phase 1에서 분석한 내용 기반
   - 형식:
   ```markdown
   # {Domain} API

   > Base: `/v2/{base-path}`

   ## METHOD /endpoint

   설명

   **Params**
   | 위치 | 이름 | 타입 | 필수 | 설명 |
   |------|------|------|------|------|
   | path | id | number | O | 리소스 ID |
   | body | name | string | O | 이름 |

   **Response**: `{Type}` 또는 `void`
   ```

### Phase 2: 프론트엔드 패턴 분석
1. **기존 remotes 패턴 확인**
   - `src/pages/**/remotes/*.ts` 파일 2~3개 샘플링
   - httpClient 사용 방식
   - 파라미터 네이밍 (params)
   - 타입 정의 (interface)

2. **기존 mutations 패턴 확인**
   - `src/pages/**/mutations/*.mutation.ts` 파일 샘플링
   - mutationOptions 사용 방식
   - queryClient.invalidateQueries 패턴

3. **DTO 위치 규칙 확인**
   - `src/pages/**/models/*.dto.ts` 구조
   - Params/Response 네이밍
   - 데이터 정의시 주석으로 필드명 매핑

### Phase 3: 통합 위치 결정
**AskUserQuestion으로 질문:**

1. "이 API를 어느 페이지에서 사용할 건가요?"
   - 선택지: 기존 페이지 선택 or "신규 페이지"
   - 여러 페이지면 콤마로 구분

2. "페이지별로 remotes를 분리할 건가요?"
   - 선택지:
     - "네 (Page First - 각 페이지에 독립된 파일)"
     - "아니오 (공유 - src/remotes/에 공통 파일)"

3. "기존 페이지 컴포넌트가 있나요?"
   - 선택지:
     - "네 (mutation만 적용)"
     - "아니오 (페이지 생성 필요)"

### Phase 4: 코드 생성

#### 4.1 DTO 파일 생성
**위치**:
- Page First: `src/pages/{page}/{subpage}/models/{resource}.dto.ts`
- 공유: `src/models/{resource}.dto.ts`

**⚠️ 백엔드 DTO 필드 검증:**
- 백엔드 Response DTO에 실제로 존재하는 필드만 프론트 DTO에 정의
- 백엔드에서 아직 추가 안 된 필드는 `TODO` 주석으로 표시하고 타입에서 제외
- 프론트 DTO에 있는데 백엔드 DTO에 없는 필드 → 런타임에 `undefined`가 되어 에러 유발
```typescript
// ⚠️ 백엔드 미구현 필드는 타입에 넣지 않음
interface Info {
  status: string;
  assignee?: string;
  // TODO: documentId — 백엔드 추가 후 타입에 포함
}
```

**내용**:
```typescript
// Create 요청
export interface Create{Resource}Params {
  field1: string;
  field2?: number;
}

// Update 요청
export interface Update{Resource}Params {
  field1?: string;
  field2?: number;
}

// Response
export interface {Resource}Response {
  id: number;
  field1: string;
  createdAt: string;
}
```

#### 4.2 Remotes 파일 생성
**위치**:
- Page First: `src/pages/{page}/{subpage}/remotes/{resource}.ts`
- 공유: `src/remotes/{resource}.ts`

**내용**:
```typescript
import { httpClient } from 'remotes';
import { SearchParamsBuilder } from 'utils/searchParams';
import type { Create{Resource}Params, {Resource}Response } from '../models/{resource}.dto';

// GET (list)
export const fetch{Resource}s = async (params: {Resource}ListParams) => {
  const { filters, cursor, limit } = params;
  const searchParams = new SearchParamsBuilder()
    .append('filter', filters.filter)
    .append('cursor', cursor?.toString() ?? '')
    .append('limit', limit?.toString() ?? '')
    .build();

  return httpClient.get<{Resource}ListResponse>('{api-path}', { searchParams });
};

// POST
export const create{Resource} = async (params: Create{Resource}Params) => {
  return httpClient.post('{api-path}', { json: params });
};

// PUT
export const update{Resource} = async (params: Update{Resource}Params) => {
  const { id, ...payload } = params;
  return httpClient.put(`{api-path}/${id}`, { json: payload });
};

// DELETE
export const delete{Resource} = async (params: Delete{Resource}Params) => {
  return httpClient.delete(`{api-path}/${params.id}`);
};
```

**주의사항**:
- 필드 매핑이 필요한 경우 (프론트엔드 필드명 ≠ 백엔드 필드명)
  ```typescript
  export const create{Resource} = async (params: Create{Resource}Params) => {
    return httpClient.post('{api-path}', {
      json: {
        backendField: params.frontendField,
        ...params
      }
    });
  };
  ```

#### 4.3 Queries 파일 생성
**위치**: `src/pages/{page}/{subpage}/queries/{resource}.query.ts`

**내용** (GET 엔드포인트가 있을 때):
```typescript
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';
import { fetch{Resource}s, fetch{Resource}Detail } from '../remotes/{resource}';

const {resource}Keys = {
  all: ['{resource}'] as const,
  list: (filters: {Resource}Filters) => [...{resource}Keys.all, 'list', filters] as const,
  infinite: (filters: {Resource}Filters) => [...{resource}Keys.all, 'infinite', filters] as const,
  detail: (id: string) => [...{resource}Keys.all, 'detail', id] as const,
};

export const {resource}Queries = {
  list: (filters: {Resource}Filters) =>
    queryOptions({
      queryKey: {resource}Keys.list(filters),
      queryFn: () => fetch{Resource}s({ filters }),
    }),
  infinite: (filters: {Resource}Filters) =>
    infiniteQueryOptions({
      queryKey: {resource}Keys.infinite(filters),
      queryFn: ({ pageParam }) => fetch{Resource}s({ filters, cursor: pageParam }),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) => lastPage?.cursor,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: {resource}Keys.detail(id),
      queryFn: () => fetch{Resource}Detail({ id }),
    }),
};
```

**규칙:**
- GET 엔드포인트별로 queryOptions 생성
- keys 객체는 `as const`로 타입 보존
- list/infinite 분리 (커서 페이지네이션 있을 때)
- `{resource}Keys`를 export하여 mutation의 invalidateQueries에서 사용

#### 4.5 Mutations 파일 생성
**위치**: `src/pages/{page}/{subpage}/mutations/{resource}.mutation.ts`

**내용**:
```typescript
import { queryClient } from 'lib/queryClient';
import { mutationOptions } from 'utils/mutationOptions';
import type { Create{Resource}Params } from '../models/{resource}.dto';
import { {resource}Keys } from '../queries/{resource}.query';
import { create{Resource}, update{Resource}, delete{Resource} } from '../remotes/{resource}';

export const {resource}Mutations = {
  create: () =>
    mutationOptions({
      mutationFn: (params: Create{Resource}Params) => create{Resource}(params),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: {resource}Keys.all,
        });
      },
    }),

  update: () =>
    mutationOptions({
      mutationFn: (params: Update{Resource}Params) => update{Resource}(params),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: {resource}Keys.all,
        });
      },
    }),

  delete: () =>
    mutationOptions({
      mutationFn: (params: Delete{Resource}Params) => delete{Resource}(params),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: {resource}Keys.all,
        });
      },
    }),
};
```

#### 4.6 페이지 통합
**기존 페이지 수정**:

1. **Import 추가**
```typescript
import { useMutation } from '@tanstack/react-query';
import { showApiErrorToast, showSuccessToast } from 'utils/toast';
import { {resource}Mutations } from './mutations/{resource}.mutation';
```

2. **useMutation 훅 추가**
```typescript
const { mutateAsync: create{Resource}, isPending } = useMutation({resource}Mutations.create());
```

3. **handleSubmit 수정**
```typescript
const handleSubmit = form.handleSubmit(async data => {
  try {
    await create{Resource}({
      field1: data.field1,
      field2: data.field2,
    });
    showSuccessToast('{리소스}가 생성되었습니다.');
    router.back();
  } catch (error) {
    showApiErrorToast(error);
  }
});
```

4. **Button 수정**
```typescript
<Button
  type="submit"
  disabled={isPending || !form.formState.isValid}
  loading={isPending}
>
  등록하기
</Button>
```

### Phase 5: 검증
```bash
pnpm typecheck
```

## 네이밍 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| **DTO 타입** | `interface` 사용 | `interface CreateUserParams` |
| **Request DTO** | `{Action}{Resource}Params` | `CreateBranchUserParams`, `UpdateOrderParams` |
| **Response DTO** | `{Resource}Response` | `UserResponse`, `OrderListResponse` |
| **Remotes 함수** | `{action}{Resource}` (camelCase) | `createUser`, `fetchOrders`, `updateBranch` |
| **Mutations 객체** | `{resource}Mutations` (camelCase) | `userMutations`, `orderMutations` |
| **파라미터명** | `params` | `(params: CreateUserParams)` |

## 파일 위치 전략

### Page First (권장)
- **장점**: 페이지 격리, 변경 용이성, 검색 범위 축소
- **단점**: 코드 중복 (3~5줄 수준)
- **사용 시기**: 도메인이 다른 경우 (branch vs dealer)

```
pages/{page}/{subpage}/
  ├── models/{resource}.dto.ts
  ├── remotes/{resource}.ts
  └── mutations/{resource}.mutation.ts
```

### 공유 (예외)
- **장점**: 코드 중복 없음
- **단점**: 페이지 간 결합도 증가
- **사용 시기**: 정말 같은 API를 여러 곳에서 사용

```
src/
  ├── models/{resource}.dto.ts
  ├── remotes/{resource}.ts
pages/{page}/
  └── mutations/{resource}.mutation.ts  # mutation만 페이지별
```

## 출력 형식

작업 완료 후:
```
✅ {Resource} API 통합 완료

생성/수정된 파일:
- .ai/specs/api/{domain}.md (API 스펙 문서)
- models/{resource}.dto.ts (DTO 타입)
- remotes/{resource}.ts (API 함수)
- queries/{resource}.query.ts (queryOptions — GET 있을 때)
- mutations/{resource}.mutation.ts (mutationOptions — POST/PUT/PATCH/DELETE 있을 때)
- {Page}Page.tsx (페이지 통합)

타입체크 통과 ✓
```
