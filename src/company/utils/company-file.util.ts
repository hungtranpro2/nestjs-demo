import { randomUUID } from 'node:crypto';

import type { StoredUpload } from '@nestjs/storage';
import { FileAsset } from '../../uploads/schemas/file-asset.schema.js';

export function toFileAsset(file: StoredUpload): FileAsset {
  return {
    id: randomUUID(),

    key: file.key,

    originalName: file.originalname,

    contentType: file.contentType,

    size: file.size,

    etag: file.etag,

    uploadedAt: new Date(),
  };
}
