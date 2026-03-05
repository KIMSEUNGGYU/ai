import type { EvalDataset } from "@agents/eval";

interface SpecInput {
  planningDoc: string;
  ticketId?: string;
}

interface SpecExpected {
  requiredSections: RegExp[];
  qualityPatterns: RegExp[];
  minLength: number;
}

export const specDataset: EvalDataset<SpecInput, SpecExpected> = {
  name: "fe-auto-spec",
  cases: [
    {
      id: "simple-list-page",
      name: "단순 목록 페이지 스펙 생성",
      tags: ["spec"],
      input: {
        planningDoc: `# 주문 목록 페이지
주문 관리 시스템에서 주문 목록을 보여주는 페이지입니다.
- 주문 번호, 고객명, 금액, 상태를 테이블로 표시
- 상태별 필터링 가능 (전체, 대기, 완료, 취소)
- 검색 가능 (주문번호, 고객명)
- 주문 클릭 시 상세 페이지로 이동
API: GET /api/orders (query: status, search, page)`,
      },
      expected: {
        requiredSections: [
          /##.*요구사항/i,
          /##.*컴포넌트/i,
          /##.*API/i,
          /##.*폴더/i,
          /##.*스코프\s*아웃/i,
          /##.*확인\s*필요/i,
        ],
        qualityPatterns: [
          /\[MUST\]/i,
          /├──|└──/,
          /(GET|POST|PUT|DELETE|PATCH)\s+\//,
        ],
        minLength: 500,
      },
    },
    {
      id: "crud-with-modal",
      name: "CRUD + 모달 스펙 생성",
      tags: ["spec"],
      input: {
        planningDoc: `# 상품 관리
상품을 등록/수정/삭제할 수 있는 관리 페이지입니다.
- 상품 목록 (이미지 썸네일, 상품명, 가격, 재고)
- 상품 등록: 모달로 열림 (상품명, 설명, 가격, 카테고리, 이미지 업로드)
- 상품 수정: 등록과 동일 모달, 기존 데이터 프리필
- 상품 삭제: 확인 다이얼로그 후 삭제
API:
  GET /api/products (query: category, search)
  POST /api/products (body: FormData)
  PUT /api/products/:id (body: FormData)
  DELETE /api/products/:id`,
      },
      expected: {
        requiredSections: [
          /##.*요구사항/i,
          /##.*컴포넌트/i,
          /##.*API/i,
          /##.*폴더/i,
          /##.*스코프\s*아웃/i,
          /##.*확인\s*필요/i,
        ],
        qualityPatterns: [
          /\[MUST\]/i,
          /├──|└──/,
          /(GET|POST|PUT|DELETE|PATCH)\s+\//,
        ],
        minLength: 800,
      },
    },
  ],
};
