# 정렬 가능한 테이블 구현 패턴

> 관련 규칙: `[COUP]` `[SRP]` `[SSOT]`

테이블에 컬럼별 정렬 기능을 추가하는 패턴. 클라이언트 사이드 정렬 기준.

## 핵심 구성요소

| 구성요소 | 역할 |
|---------|------|
| `TableHeadColumn` | 컬럼 설정 타입 (width, sortable, sortType 등) |
| `useTableSort` | 정렬 상태 관리 + 데이터 정렬 로직 |
| `TableHeadRow` | 정렬 UI 렌더링 (아이콘, 클릭 핸들러) |
| `columns.ts` | 페이지별 컬럼 설정 상수 |

---

## 1. 폴더 구조

```
src/
├── types/table.ts                          # 공통 타입 정의
├── hooks/useTableSort.ts                   # 정렬 훅
├── components/table/TableHeadRow.tsx       # 헤더 컴포넌트
└── pages/{page-name}/
    ├── constants/columns.ts                # 컬럼 정의 ← 신규
    └── components/table/{PageName}Table.tsx # 테이블 컴포넌트 ← 신규
```

---

## 2. 타입 정의

### TableHeadColumn (`types/table.ts`)

```typescript
export type SortDirection = 'none' | 'asc' | 'desc';
export type SortType = 'string' | 'number' | 'date' | 'datetime';

export interface TableHeadColumn {
  key?: string;           // 데이터 필드명 (정렬 시 필수)
  title: string;          // 표시 제목
  width?: number;
  textAlign?: 'left' | 'center' | 'right';
  css?: CSSObject;
  // Sort 관련
  sortable?: boolean;     // 정렬 가능 여부
  sortType?: SortType;    // 정렬 타입
  defaultSort?: SortDirection;  // 초기 정렬 방향
}

// 정렬 가능 컬럼 타입 (key, sortType 필수)
export type SortableTableHeadColumn = TableHeadColumn & {
  key: string;
  sortType: SortType;
};
```

---

## 3. 단계별 가이드

### 3.1 컬럼 상수 정의

**무엇을**: 테이블 컬럼 설정을 상수로 정의
**왜**: 컬럼 설정을 한 곳에서 관리하여 변경 용이성 확보 [SSOT]

```typescript
// src/pages/{page-name}/constants/columns.ts
import type { TableHeadColumn } from 'types/table';

export const {PAGE_NAME}_COLUMNS = [
  // 정렬 가능 + 기본 정렬
  {
    key: '{sortableField}',
    title: '{표시명}',
    width: 170,
    sortable: true,
    sortType: 'datetime',
    defaultSort: 'desc',     // 페이지 로드 시 이 컬럼으로 정렬
  },
  // 정렬 가능 (기본 정렬 없음)
  {
    key: '{anotherField}',
    title: '{표시명}',
    width: 120,
    sortable: true,
    sortType: 'date',
  },
  // 정렬 불가 (key 있음)
  { key: '{field}', title: '{표시명}', width: 150 },
  // 정렬 불가 (key 없음)
  { title: '{표시명}', width: 100, textAlign: 'center' },
] satisfies TableHeadColumn[];
```

### 3.2 테이블 컴포넌트 구현

**무엇을**: useTableSort 훅과 TableHeadRow를 연결
**왜**: 정렬 로직을 훅으로 분리하여 UI와 비즈니스 로직 분리 [SRP]

```typescript
// src/pages/{page-name}/components/table/{PageName}Table.tsx
import { Table } from '@tds/desktop';
import { TableHeadRow } from 'components/table/TableHeadRow';
import { useTableSort } from 'hooks/useTableSort';
import { {PAGE_NAME}_COLUMNS } from '../../constants/columns';

export function {PageName}Table() {
  const { sortedData, getSortValue, handleSortChange } = useTableSort({
    data: {dataSource},           // API 응답 데이터
    columns: {PAGE_NAME}_COLUMNS,
  });

  return (
    <Table.Root
      head={
        <TableHeadRow
          columns={{PAGE_NAME}_COLUMNS}
          getSortValue={getSortValue}
          onSortChange={handleSortChange}
        />
      }
      body={sortedData.map(item => (
        <{PageName}TableRow key={item.id} data={item} />
      ))}
    />
  );
}
```

---

## 4. API 레퍼런스

### useTableSort

```typescript
interface UseTableSortOptions<T> {
  data: T[];                    // 정렬할 데이터 배열
  columns: TableHeadColumn[];   // 컬럼 설정 (sortType 자동 추출)
}

interface UseTableSortReturn<T> {
  sortedData: T[];              // 정렬된 데이터
  sortConfig: SortConfig | null; // 현재 정렬 상태 { key, direction }
  getSortValue: (key: string) => SortDirection;
  handleSortChange: (key: string) => (direction: SortDirection) => void;
}
```

### TableHeadRow

```typescript
interface Props {
  columns: TableHeadColumn[];
  getSortValue?: (key: string) => SortDirection;  // 없으면 정렬 UI 숨김
  onSortChange?: (key: string) => (direction: SortDirection) => void;
}
```

**동작 방식**: `sortable: true`이고 `key`가 있고 `getSortValue`/`onSortChange`가 전달된 컬럼만 정렬 아이콘 표시

---

## 5. 데이터 흐름

```
사용자 정렬 아이콘 클릭
    │
    ↓
TableHeadRow: onSortChange(key)(direction)
    │
    ↓
useTableSort: setSortConfig({ key, direction })
    │
    ↓
sortedData = useMemo(() => {
    // 1. sortConfig가 없거나 direction이 'none'이면 원본 반환
    // 2. columns에서 해당 key의 sortType 조회
    // 3. sortType에 따라 비교 함수 선택
    // 4. direction에 따라 오름차순/내림차순 정렬
})
    │
    ↓
테이블 리렌더링 (정렬된 데이터)
```

---

## 6. 정렬 타입별 비교

| sortType | 설명 | 예시 데이터 | 파싱 방식 |
|----------|------|-------------|-----------|
| `string` | 문자열 사전순 | 'Apple', '가나다' | `localeCompare()` |
| `number` | 숫자 크기순 | 100, 200, 300 | `Number()` |
| `date` | 날짜 | '2025-01-15' | `new Date()` |
| `datetime` | 날짜시간 | '2025-01-15 10:30' | `replace(' ', 'T')` → Date |

### datetime 형식 주의

```typescript
// useTableSort.ts 내부
function parseDateTime(dateStr: string): Date {
  // '2025-01-15 10:30' → '2025-01-15T10:30'
  return new Date(dateStr.replace(' ', 'T'));
}
```

**지원 형식**: `'YYYY-MM-DD HH:mm'` (공백 구분)

---

## 7. 명명 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 컬럼 상수 | `SCREAMING_SNAKE_CASE` | `DELIVERY_STATUS_COLUMNS` |
| 테이블 컴포넌트 | `PascalCase + Table` | `DeliveryStatusTable` |
| key 값 | 데이터 필드명과 일치 | `key: '주문일시'` ↔ `data.주문일시` |

---

## 8. 주의사항

### key와 데이터 필드명 일치

```typescript
// Bad - key와 필드명 불일치
{ key: 'orderDate', ... }
data: { 주문일시: '2025-01-15' }  // 정렬 안됨!

// Good
{ key: '주문일시', ... }
data: { 주문일시: '2025-01-15' }
```

### sortable: true면 sortType 필수

```typescript
// Bad - sortType 없음
{ key: 'date', sortable: true }  // 기본값 'string'으로 정렬됨

// Good
{ key: 'date', sortable: true, sortType: 'date' }
```

### defaultSort는 하나만

여러 컬럼에 `defaultSort` 설정 시 첫 번째만 적용됨.

```typescript
// 주문일시로만 기본 정렬
[
  { key: '주문일시', defaultSort: 'desc', ... },  // ✓ 적용
  { key: '라이브일자', defaultSort: 'asc', ... }, // ✗ 무시
]
```

### 정렬 UI 조건

TableHeadRow에서 정렬 아이콘이 표시되려면 **4가지 조건 모두 충족**:

1. `column.sortable === true`
2. `column.key` 존재
3. `getSortValue` prop 전달
4. `onSortChange` prop 전달

---

## 9. 확장 가능성

### 서버 사이드 정렬

현재는 클라이언트 정렬. 서버 정렬 필요 시:

```typescript
// sortConfig를 API 파라미터로 전달
const { data } = useQuery({
  queryKey: ['items', sortConfig],
  queryFn: () => fetchItems({
    sortBy: sortConfig?.key,
    sortOrder: sortConfig?.direction
  }),
});

// useTableSort는 정렬 로직 없이 상태만 관리
const { sortConfig, getSortValue, handleSortChange } = useTableSort({
  data: [],  // 빈 배열 (서버가 정렬)
  columns: COLUMNS,
});
```

### 다중 컬럼 정렬

현재는 단일 컬럼 정렬. 다중 정렬 필요 시 `sortConfig`를 배열로 확장.

---

## 10. 검증 체크리스트

- [ ] 컬럼 상수에 `satisfies TableHeadColumn[]` 추가
- [ ] 정렬 컬럼에 `key`, `sortable`, `sortType` 모두 설정
- [ ] `key` 값이 데이터 객체의 필드명과 일치
- [ ] 브라우저에서 정렬 아이콘 클릭 시 데이터 정렬 확인
- [ ] 기본 정렬이 페이지 로드 시 적용되는지 확인
- [ ] datetime 형식이 'YYYY-MM-DD HH:mm'인지 확인
