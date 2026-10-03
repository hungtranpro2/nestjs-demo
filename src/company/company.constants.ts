import type { Company } from './schemas/company.schema.js';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum CompanySortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export const COMPANY_SORT_FIELDS: Record<CompanySortBy, keyof Company> = {
  [CompanySortBy.NAME]: 'name',
  [CompanySortBy.CREATED_AT]: 'createdAt',
  [CompanySortBy.UPDATED_AT]: 'updatedAt',
};
