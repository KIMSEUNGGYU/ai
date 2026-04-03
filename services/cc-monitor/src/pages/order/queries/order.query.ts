import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';
import { fetchOrderList, fetchOrderDetail } from '../remotes/order';
import type { OrderFilters } from '../models/order.dto';

const orderKeys = {
  all: ['order'] as const,
  list: (filters: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
  infinite: (filters: OrderFilters) => [...orderKeys.all, 'infinite', filters] as const,
  detail: (orderId: string) => [...orderKeys.all, 'detail', orderId] as const,
};

export const orderQuery = {
  infinite: (filters: OrderFilters) =>
    infiniteQueryOptions({
      queryKey: orderKeys.infinite(filters),
      queryFn: ({ pageParam }) => fetchOrderList({ filters, cursor: pageParam }),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) => lastPage?.cursor,
    }),
  detail: (orderId: string) =>
    queryOptions({
      queryKey: orderKeys.detail(orderId),
      queryFn: () => fetchOrderDetail({ orderId }),
    }),
};

export { orderKeys };
