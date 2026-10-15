import { StoredUpload } from '@nestjs/storage';
import { UploadedFileResponse } from '../interfaces/uploaded-file-response.interface.js';

export function toUploadedFileResponse(
  file: StoredUpload,
): UploadedFileResponse {
  return {
    key: file.key,
    originalName: file.originalname,
    contentType: file.contentType,
    size: file.size,
    etag: file.etag,
  };
}
