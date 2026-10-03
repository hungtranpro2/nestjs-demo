export interface PaginationMeta {
  current: number;
  pageSize: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  result: T[];
  meta: PaginationMeta;
}
