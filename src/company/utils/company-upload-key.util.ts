import { randomUUID } from 'node:crypto';

export function generateCompanyLogoKey(extension: string): string {
  return ['companies', 'logos', `${randomUUID()}${extension}`].join('/');
}

export function generateCompanyDocumentKey(extension: string): string {
  return ['companies', 'documents', `${randomUUID()}${extension}`].join('/');
}
