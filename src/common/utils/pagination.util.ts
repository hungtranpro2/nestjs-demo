import { BadRequestException } from '@nestjs/common';
import type { PaginatedResponse } from '../interfaces/paginated-response.interface.js';

export function getPaginationOffset(page: number, limit: number): number {
  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip) || skip < 0) {
    throw new BadRequestException('Pagination offset is too large');
  }
  return skip;
}

export function paginate<T>(
  data: T[],
  totalItems: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    result: data,
    meta: {
      current: page,
      pageSize: limit,
      total: totalItems,
      pages: totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: totalPages > 0 && page > 1,
    },
  };
}
