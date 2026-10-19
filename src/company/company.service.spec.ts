import { Types } from 'mongoose';
import { CompanyService } from './company.service.js';

function mockQuery<T>(result: T) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
}

describe('Company file lifecycle', () => {
  it('removes logo reference before deleting its public R2 object', async () => {
    const sequence: string[] = [];
    const query = mockQuery({ logo: { key: 'companies/logos/logo.png' } });
    query.exec.mockImplementation(() => {
      sequence.push('db');
      return Promise.resolve({ logo: { key: 'companies/logos/logo.png' } });
    });
    const model = { findOneAndUpdate: jest.fn().mockReturnValue(query) };
    const storage = {
      safeDeletePublic: jest.fn().mockImplementation(() => {
        sequence.push('r2');
        return Promise.resolve();
      }),
    };
    const service = new CompanyService(model as never, storage as never);

    await expect(service.removeLogo(new Types.ObjectId().toString())).resolves.toBeNull();
    expect(sequence).toEqual(['db', 'r2']);
    expect(storage.safeDeletePublic).toHaveBeenCalledWith('companies/logos/logo.png');
  });

  it('removes only the target document, then cleans up private storage', async () => {
    const query = mockQuery({
      documents: [
        { id: 'doc-a', key: 'companies/documents/a.pdf' },
        { id: 'doc-b', key: 'companies/documents/b.pdf' },
      ],
    });
    const model = { findOneAndUpdate: jest.fn().mockReturnValue(query) };
    const storage = { safeDeletePrivate: jest.fn().mockResolvedValue(undefined) };
    const service = new CompanyService(model as never, storage as never);

    await service.removeDocument(new Types.ObjectId().toString(), 'doc-b');
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ 'documents.id': 'doc-b' }),
      { $pull: { documents: { id: 'doc-b' } } },
      { returnDocument: 'before' },
    );
    expect(storage.safeDeletePrivate).toHaveBeenCalledWith('companies/documents/b.pdf');
  });

  it('signs only a document resolved from the owner company', async () => {
    const query = mockQuery({
      documents: [{ id: 'doc-a', key: 'companies/documents/a.pdf', originalName: 'a.pdf' }],
    });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    const storage = { getPrivateDocumentUrl: jest.fn().mockResolvedValue('https://signed.example/a') };
    const service = new CompanyService(model as never, storage as never);
    const userId = new Types.ObjectId().toString();

    const result = await service.getDocumentUrl(
      new Types.ObjectId().toString(), 'doc-a', userId, 'inline',
    );
    expect(result).toEqual({ url: 'https://signed.example/a', expiresIn: 300 });
    expect(storage.getPrivateDocumentUrl).toHaveBeenCalledWith(
      'companies/documents/a.pdf', 'a.pdf', 'inline',
    );
    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ 'createdBy._id': new Types.ObjectId(userId) }),
    );
  });
});
