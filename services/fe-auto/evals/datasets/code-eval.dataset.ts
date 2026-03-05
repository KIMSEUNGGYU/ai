import type { EvalDataset } from "@agents/eval";

interface CodeInput {
  spec: string;
  projectPath: string;
}

interface CodeExpected {
  filePatterns: RegExp[];
  noErrors: boolean;
  minFiles: number;
}

export const codeDataset: EvalDataset<CodeInput, CodeExpected> = {
  name: "fe-auto-code",
  cases: [
    {
      id: "simple-list-page",
      name: "단순 목록 페이지 코드 생성",
      tags: ["code"],
      input: {
        spec: `## 요구사항
- [MUST] 주문 목록을 테이블로 표시 (주문번호, 고객명, 금액, 상태)
- [MUST] 상태별 필터링 (전체, 대기, 완료, 취소)
- [SHOULD] 검색 기능 (주문번호, 고객명)

## 컴포넌트 구조
OrderListPage
├── OrderFilter (props: filters, onChange)
│   ├── SearchInput
│   └── StatusSelect
└── OrderTable (props: orders, isLoading)
    └── OrderRow (props: order)

## API 계약
GET /api/orders → OrderDTO[] (params: { status?, search?, page? })

## 폴더 구조
src/pages/orders/order-list/
├── OrderListPage.tsx
├── components/
│   ├── OrderFilter.tsx
│   └── OrderTable.tsx
├── models/orders.dto.ts
├── remotes/orders.ts
└── queries/orders.query.ts

## 스코프 아웃
- 페이지네이션
- 주문 상세 페이지

## 확인 필요
- 해당 없음`,
        projectPath: "", // will be set dynamically to fixture dir
      },
      expected: {
        filePatterns: [
          /생성|created|wrote/i,
          /OrderListPage|order-list/i,
          /models|dto/i,
          /remotes|queries/i,
        ],
        noErrors: true,
        minFiles: 3,
      },
    },
  ],
};
