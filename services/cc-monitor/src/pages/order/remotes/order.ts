import { apiClient } from '../../../lib/api-client';
import type {
  FetchOrderListParams,
  FetchOrderListResponse,
  FetchOrderDetailParams,
  FetchOrderDetailResponse,
} from '../models/order.dto';

/** undefined 값을 제외한 searchParams 객체 생성 */
function cleanParams(obj: Record<string, string | number | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) result[k] = String(v);
  }
  return result;
}

/** 주문 목록 조회 */
export async function fetchOrderList(params: FetchOrderListParams): Promise<FetchOrderListResponse> {
  const { filters, cursor, limit } = params;
  const searchParams = cleanParams({
    status: filters.status,
    days: filters.days,
    search: filters.search,
    cursor,
    limit,
  });

  return apiClient.get('orders', { searchParams }).json<FetchOrderListResponse>();
}

/** 주문 상세 조회 */
export async function fetchOrderDetail(params: FetchOrderDetailParams): Promise<FetchOrderDetailResponse> {
  return apiClient.get(`orders/${params.orderId}`).json<FetchOrderDetailResponse>();
}
