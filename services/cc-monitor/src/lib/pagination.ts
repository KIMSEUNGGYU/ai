/** Cursor 기반 무한 스크롤 페이지네이션 파라미터 */
export interface CursorPaginationParams {
  cursor?: number;
  limit?: number;
}

/** Cursor 기반 무한 스크롤 페이지네이션 응답 */
export interface CursorPaginationResponse<T> {
  cursor?: number;
  items: T[];
}
