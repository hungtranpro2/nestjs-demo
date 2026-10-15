import { randomUUID } from 'node:crypto';

export function generateUploadKey(extension: string): string {
  return `uploads/${randomUUID()}${extension}`;
}
