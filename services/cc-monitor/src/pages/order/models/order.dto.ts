import type { CursorPaginationParams, CursorPaginationResponse } from '../../../lib/pagination';

// ── 공통 타입 ──

/** 주문 상태 */
export type OrderStatus = '결제완료' | '배송중' | '배송완료' | '취소';

/** 주문 필터 */
export interface OrderFilters {
  /** 주문 상태 */
  status?: OrderStatus;
  /** 조회 기간 (일) */
  days?: number;
  /** 검색어 (주문번호, 주문자명) */
  search?: string;
}

// ── 목록 조회 ──

export interface FetchOrderListParams extends CursorPaginationParams {
  filters: OrderFilters;
}

export interface OrderListItem {
  /** 주문 ID */
  orderId: string;
  /** 주문번호 */
  orderNo: string;
  /** 주문일시 */
  orderedAt: string;
  /** 주문자명 */
  ordererName: string;
  /** 상품명 */
  productName: string;
  /** 주문 금액 */
  amount: number;
  /** 주문 상태 */
  status: OrderStatus;
}

export interface FetchOrderListResponse extends CursorPaginationResponse<OrderListItem> {}

// ── 상세 조회 ──

export interface FetchOrderDetailParams {
  /** 주문 ID */
  orderId: string;
}

export interface OrderDetail {
  /** 주문 ID */
  orderId: string;
  /** 주문번호 */
  orderNo: string;
  /** 주문일시 */
  orderedAt: string;
  /** 주문자명 */
  ordererName: string;
  /** 주문자 연락처 */
  ordererPhone: string;
  /** 배송지 주소 */
  address: string;
  /** 상품명 */
  productName: string;
  /** 상품 수량 */
  quantity: number;
  /** 주문 금액 */
  amount: number;
  /** 주문 상태 */
  status: OrderStatus;
  /** 배송 메모 */
  memo?: string;
}

export type FetchOrderDetailResponse = OrderDetail;
