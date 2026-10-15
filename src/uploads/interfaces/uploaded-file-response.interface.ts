export interface UploadedFileResponse {
  key: string;

  originalName: string;

  contentType: string;

  size: number;

  etag?: string;
}
