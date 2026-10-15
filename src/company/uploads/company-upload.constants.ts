export const COMPANY_LOGO_FIELD = 'logo';

export const COMPANY_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_COMPANY_LOGO_SIZE = 5 * 1024 * 1024;

export const COMPANY_DOCUMENT_FIELD = 'documents';

export const COMPANY_DOCUMENT_TYPES = ['application/pdf'] as const;

export const MAX_COMPANY_DOCUMENT_SIZE = 20 * 1024 * 1024;

export const MAX_COMPANY_DOCUMENT_COUNT = 5;
