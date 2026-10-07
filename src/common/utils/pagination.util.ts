import { BadRequestException } from '@nestjs/common';
import type { PaginatedResult } from '../interfaces/paginated-result.interface.js';

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
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    items: data,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: totalPages > 0 && page > 1,
    },
  };
}

export function isPaginatedResult(
  value: unknown,
): value is PaginatedResult<unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('items' in value) ||
    !Array.isArray(value.items) ||
    !('meta' in value) ||
    typeof value.meta !== 'object' ||
    value.meta === null
  ) {
    return false;
  }
  const meta = value.meta;
  return (
    'page' in meta &&
    typeof meta.page === 'number' &&
    'limit' in meta &&
    typeof meta.limit === 'number' &&
    'totalItems' in meta &&
    typeof meta.totalItems === 'number' &&
    'totalPages' in meta &&
    typeof meta.totalPages === 'number' &&
    'hasNextPage' in meta &&
    typeof meta.hasNextPage === 'boolean' &&
    'hasPreviousPage' in meta &&
    typeof meta.hasPreviousPage === 'boolean'
  );
}
