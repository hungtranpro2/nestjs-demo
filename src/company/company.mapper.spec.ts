import { Types } from 'mongoose';
import { toCompanyDetail, toCompanyListItem } from './company.mapper.js';
import type { CompanyDetailRecord } from './dto/company-response.dto.js';

describe('Company API mappers', () => {
  const fixture: CompanyDetailRecord = {
    _id: new Types.ObjectId(),
    name: 'Test Company',
    status: undefined,
    address: 'Da Nang',
    description: 'test',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    logo: {
      id: 'logo-1',
      key: 'companies/logos/test.png',
      originalName: 'test.png',
      contentType: 'image/png',
      size: 10,
      uploadedAt: new Date('2026-01-01'),
    },
    documents: [{
      id: 'doc-1',
      key: 'companies/documents/private.pdf',
      originalName: 'private.pdf',
      contentType: 'application/pdf',
      size: 20,
      uploadedAt: new Date('2026-01-01'),
    }],
  };

  it('returns a public logo URL but never returns storage keys', () => {
    const data = toCompanyDetail(fixture, 'https://assets.example.com/companies/logos/test.png');

    expect(data.logo?.url).toContain('assets.example.com');
    expect(data.documents).toHaveLength(1);
    expect(data.documents[0].id).toBe('doc-1');
    expect(JSON.stringify(data)).not.toContain('companies/documents/private.pdf');
    expect(data.logo).not.toHaveProperty('key');
    expect(data.documents[0]).not.toHaveProperty('key');
  });

  it('omits private documents from list records', () => {
    const data = toCompanyListItem(fixture, 'https://assets.example.com/logo.png');
    expect(data.logo?.url).toContain('assets.example.com');
    expect(data).not.toHaveProperty('documents');
  });

  it('includes explicit null logo and empty documents when absent', () => {
    const data = toCompanyDetail({
      ...fixture,
      logo: undefined,
      documents: undefined,
    }, null);
    expect(data.logo).toBeNull();
    expect(data.documents).toEqual([]);
  });
});
