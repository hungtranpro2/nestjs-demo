export const SINGLE_UPLOAD_FIELD_NAME = 'file';

export const MULTIPLE_UPLOAD_FIELD_NAME = 'files';

export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB

export const MAX_UPLOAD_FILE_COUNT = 5;

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;
