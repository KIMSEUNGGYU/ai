# 필터 + 무한스크롤 테이블 패턴

> 관련 규칙: `[COUP]` `[DECL]` `[API]`

URL 동기화 필터와 cursor 기반 무한스크롤 테이블을 조합한 리스트 페이지 구현 패턴.

## 핵심 구성요소

| 구성요소 | 역할 |
|---------|------|
| `nuqs` (useQueryStates) | URL ↔ 필터 상태 동기화 |
| `infiniteQueryOptions` | cursor 기반 무한 쿼리 정의 |
| `InfiniteScrollLoader` | IntersectionObserver로 다음 페이지 트리거 |
| `SearchParamsBuilder` | 쿼리 파라미터 빌더 |
| `normalizeFilters` | 배열 필터 정렬로 캐시 키 일관성 |
| `useTableCheckboxState` | Set 기반 O(1) 체크박스 상태 (선택) |

---

## 1. 폴더 구조

```
[page-name]/
├── [Page].tsx                     # 메인 페이지
├── components/
│   ├── Filter.tsx                 # 필터 UI
│   └── table/
│       ├── [Domain]Table.tsx      # 테이블 컨테이너 (무한 쿼리)
│       ├── [Domain]TableBody.tsx  # 행 렌더링 + InfiniteScrollLoader
│       └── [Domain]TableRow.tsx   # 개별 행
├── hooks/
│   └── use[Domain]Filters.ts      # nuqs 기반 필터 상태
├── queries/
│   ├── [domain].query.ts          # infiniteQueryOptions
│   └── filter.query.ts            # 필터 옵션 쿼리 (선택)
├── remotes/
│   ├── [domain].ts                # API 호출 (fetch*)
│   └── filter.ts                  # 필터 옵션 API (선택)
├── mutations/
│   └── [domain].mutation.ts       # mutationOptions (선택)
├── models/
│   └── [domain].dto.ts            # 타입 정의
└── constants/
    └── columns.ts                 # 테이블 컬럼 정의
```

---

## 2. 필터 구현

### 2.1 필터 상태 훅 (useXxxFilters)

```typescript
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

const STATUS_LIST = ['pending', 'completed', 'cancelled'] as const;

export function useDocumentTaskFilters() {
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    startDate: parseAsDate,
    endDate: parseAsDate,
    taskStatus: parseAsArrayOf(parseAsStringLiteral(STATUS_LIST)).withDefault([]),
  });

  const resetFilters = () => {
    setFilters({
      search: '',
      startDate: null,
      endDate: null,
      taskStatus: [],
    });
  };

  return { filters, setFilters, resetFilters };
}
```

**파서 종류:**
| 파서 | 용도 |
|------|------|
| `parseAsString` | 문자열 (검색어) |
| `parseAsDate` | 날짜 (YYYY-MM-DD) |
| `parseAsBoolean` | 체크박스 |
| `parseAsArrayOf(parseAsString)` | 문자열 배열 |
| `parseAsArrayOf(parseAsStringLiteral(LIST))` | 타입 안전 열거형 배열 |

### 2.2 필터 컴포넌트

```tsx
export function Filter() {
  const { filters, setFilters } = useDocumentTaskFilters();

  // 검색어는 로컬 상태 + 디바운스
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedUpdateSearch = useDebounce((search: string) => setFilters({ search }), 500);

  return (
    <div css={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* 검색 필드 (디바운스) */}
      <SearchTextField
        value={localSearch}
        onChange={e => {
          setLocalSearch(e.target.value);
          debouncedUpdateSearch(e.target.value);
        }}
      />

      {/* 날짜 필터 */}
      <DateRangePickerField
        value={[filters.startDate, filters.endDate]}
        onValueChange={([from, to]) => setFilters({ startDate: from, endDate: to })}
      />

      {/* 다중 선택 필터 */}
      <MultiSelectField
        placeholder="상태"
        value={filters.taskStatus}
        onValueChange={status => setFilters({ taskStatus: status })}
        options={statusOptions}
      />

      {/* 총 개수 */}
      <SuspenseQuery {...queryOptions.count({ filters })}>
        {({ data }) => <Txt>{`총 ${data.count.toLocaleString()}개`}</Txt>}
      </SuspenseQuery>
    </div>
  );
}
```

---

## 3. Query/Remote 패턴

### 3.1 Remote (API 호출)

```typescript
export const fetchDocumentTasks = async (params: DocumentTaskListParams) => {
  const { filters, cursor, limit } = params;

  const searchParams = new SearchParamsBuilder()
    .append('search', filters.search)
    .appendDate('startDate', filters.startDate)
    .appendDate('endDate', filters.endDate)
    .appendArray('taskStatus', filters.taskStatus)
    .append('cursor', cursor?.toString() ?? '')
    .append('limit', limit?.toString() ?? '')
    .build();

  return httpClient.get<DocumentTaskListResponse>('document-tasks', { searchParams });
};
```

**SearchParamsBuilder 메서드:**
| 메서드 | 용도 |
|--------|------|
| `append(name, value)` | 문자열 추가 |
| `appendArray(name, values)` | 배열 반복 추가 |
| `appendDate(name, date)` | 날짜 포맷팅 (yyyy-MM-dd) |
| `appendBoolean(name, value)` | 불린 → 'true'/'false' |
| `appendPageOffset(page, size)` | offset 계산: (page-1)*size |

### 3.2 Query (infiniteQueryOptions)

```typescript
import { infiniteQueryOptions } from '@tanstack/react-query';

export const documentTaskQueryOptions = {
  documentsInfinite: (params: { filters: DocumentTaskFilters }) => {
    const { filters } = params;

    return infiniteQueryOptions({
      queryKey: [
        'document-task-infinite',
        normalizeFilters(filters, ['taskStatus']),  // 배열 필터 정규화
      ] as const,
      queryFn: ({ pageParam }) => fetchDocumentTasks({ filters, cursor: pageParam }),
      initialPageParam: 0,
      getNextPageParam: lastPage => lastPage?.cursor,
    });
  },

  count: (params: { filters: DocumentTaskFilters }) => {
    return queryOptions({
      queryKey: ['document-task-count', normalizeFilters(params.filters, ['taskStatus'])],
      queryFn: () => fetchDocumentTaskCount(params.filters),
    });
  },
};
```

### 3.3 쿼리 키 정규화

`normalizeFilters` — 배열 필터 정렬로 캐시 키 일관성 보장. 구현은 `api-layer convention` 참조.

---

## 4. 테이블 컴포넌트

### 4.1 테이블 컨테이너 (XxxTable)

```tsx
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';

export function DocumentTaskTable({ checkboxState }: Props) {
  const { filters } = useDocumentTaskFilters();

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isLoading } = useInfiniteQuery({
    ...documentTaskQueryOptions.documentsInfinite({ filters }),
    placeholderData: keepPreviousData,  // 필터 변경 시 이전 데이터 유지
  });

  // 모든 페이지 데이터 병합
  const items = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <ScrollArea orientation="both" maxHeight="calc(100vh - 252px)">
      <Table.Root
        fixedLayout
        variant="zebra"
        head={<TableHeader checkboxState={checkboxState} allIds={items.map(i => i.id)} />}
        body={
          isLoading ? (
            <TableInfiniteScrollLoader colSpan={COLUMNS.length} />
          ) : (
            <DocumentTaskTableBody
              items={items}
              checkboxState={checkboxState}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          )
        }
      />
    </ScrollArea>
  );
}
```

### 4.2 테이블 바디 (XxxTableBody)

```tsx
export function DocumentTaskTableBody({
  items,
  checkboxState,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Props) {
  if (items.length === 0) {
    return <EmptyTable title="데이터가 없어요" />;
  }

  return (
    <>
      {items.map(item => (
        <DocumentTaskTableRow key={item.id} item={item} checkboxState={checkboxState} />
      ))}

      {/* 무한 스크롤 트리거 */}
      {hasNextPage && (
        <tr>
          <Table.Cell colSpan={COLUMNS.length} css={{ padding: 0 }}>
            <InfiniteScrollLoader
              enabled={!isFetchingNextPage}
              callback={fetchNextPage}
            />
          </Table.Cell>
        </tr>
      )}
    </>
  );
}
```

### 4.3 InfiniteScrollLoader

```tsx
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';
import { usePreservedCallback } from 'hooks/usePreservedCallback';

export const InfiniteScrollLoader = ({
  children = <Loader><Loader.Spinner /></Loader>,
  callback,
  enabled = true,
  options = { threshold: 0.3 },
}: Props) => {
  const preservedCallback = usePreservedCallback(callback);

  const ref = useIntersectionObserver<HTMLDivElement>(entry => {
    if (!enabled) return;
    if (entry.isIntersecting) {
      preservedCallback();
    }
  }, options);

  return <div ref={ref}>{children}</div>;
};
```

---

## 5. 체크박스 상태 (선택)

테이블에서 다중 선택 액션이 필요한 경우 사용.

```tsx
import { useTableCheckboxState } from 'hooks/useTableCheckboxState';

function Content() {
  const { filters } = useDocumentTaskFilters();

  // 필터 변경 시 선택 초기화
  const checkboxState = useTableCheckboxState<number>({ resetDeps: [filters] });

  return (
    <>
      <ActionButton checkboxState={checkboxState} />
      <DocumentTaskTable checkboxState={checkboxState} />
    </>
  );
}
```

### 헤더 체크박스

```tsx
const headerCheckState = checkboxState.getHeaderCheckState(allIds.length);

<Table.Checkbox
  checked={headerCheckState}  // true | false | 'indeterminate'
  onCheckedChange={checked => checkboxState.toggleAll(allIds, checked)}
/>
```

### 행 체크박스

```tsx
<Table.Checkbox
  checked={checkboxState.isChecked(item.id)}
  onCheckedChange={checked => checkboxState.toggleItem(item.id, checked)}
/>
```

---

## 6. 데이터 흐름

```
사용자 인터랙션
    │
    ├─ 필터 변경
    │   └─ setFilters({ ... })
    │       └─ URL 쿼리 업데이트 (nuqs)
    │           └─ queryKey 변경
    │               └─ useInfiniteQuery 자동 리페칭
    │                   └─ keepPreviousData로 이전 데이터 유지
    │                       └─ 새 데이터 로드
    │
    └─ 스크롤 (테이블 끝)
        └─ InfiniteScrollLoader 감지 (IntersectionObserver)
            └─ fetchNextPage()
                └─ queryFn({ pageParam: cursor })
                    └─ 응답: { cursor, items }
                        └─ pages 배열에 추가
                            └─ flatMap으로 병합하여 렌더링
```

---

## 7. 명명 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 훅 | `use + Domain + 기능` | `useDocumentTaskFilters` |
| 쿼리 옵션 | `[domain]QueryOptions` | `documentTaskQueryOptions` |
| Remote 함수 | `fetch + 기능` | `fetchDocumentTasks` |
| 컴포넌트 | `Domain + 역할` | `DocumentTaskTable`, `DocumentTaskTableBody` |
| 쿼리 키 | `[domain-action, filters]` | `['document-task-infinite', normalizedFilters]` |

---

## 8. 성능 최적화

| 기법 | 설명 |
|------|------|
| `keepPreviousData` | 필터 변경 시 이전 데이터 유지 (깜빡임 방지) |
| `debounce 500ms` | 검색 입력 디바운싱 |
| `로컬 상태` | 검색 필드는 로컬 상태로 즉시 반응 |
| `staleTime` | 필터 옵션은 `days(1)` 캐싱 |
| `normalizeFilters` | 배열 순서 상관없이 같은 캐시 사용 |
| `IntersectionObserver` | 스크롤 이벤트 대신 관찰자 패턴 |
| `Set` | 체크박스 상태를 Set으로 O(1) 조회 |

---

## 9. 주의사항

1. **cursor vs offset**
   - 대용량 데이터: cursor 기반 (권장)
   - 작은 데이터/간단한 페이지네이션: offset 기반

2. **필터 리셋 시 선택 초기화**
   ```tsx
   const checkboxState = useTableCheckboxState({ resetDeps: [filters] });
   ```

3. **무한 스크롤 중복 방지**
   ```tsx
   <InfiniteScrollLoader enabled={!isFetchingNextPage} ... />
   ```

4. **빈 상태 처리**
   - `isLoading`: 초기 로딩 스피너
   - `items.length === 0`: EmptyTable 표시

5. **URL 파라미터 타입 안전성**
   ```typescript
   // Bad - 타입 검증 없음
   parseAsString

   // Good - 열거형 검증
   parseAsArrayOf(parseAsStringLiteral(STATUS_LIST))
   ```
