import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_FILE_COUNT,
  MAX_UPLOAD_FILE_SIZE,
  MULTIPLE_UPLOAD_FIELD_NAME,
  SINGLE_UPLOAD_FIELD_NAME,
} from './uploads.constants.js';
import { StoredUpload, uploadToDisk } from '@nestjs/storage';
import { R2_PRIVATE_DISK } from '../storage/storage.constants.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { generateUploadKey } from './utils/upload-key.util.js';
import { toUploadedFileResponse } from './utils/upload-response.util.js';

@Controller('uploads')
export class UploadsController {
  @Post('single')
  @ResponseMessage('File uploaded successfully')
  @UseInterceptors(
    FileInterceptor(SINGLE_UPLOAD_FIELD_NAME, {
      storage: uploadToDisk({
        disk: R2_PRIVATE_DISK,

        contentTypes: [...ALLOWED_UPLOAD_CONTENT_TYPES],

        key: (file) => generateUploadKey(file.extension),
      }),

      limits: {
        fileSize: MAX_UPLOAD_FILE_SIZE,

        files: 1,
      },
    }),
  )
  uploadSingle(@UploadedFile() file: StoredUpload | undefined) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return toUploadedFileResponse(file);
  }

  // MULTIPLE
  @Post('multiple')
  @ResponseMessage('Files uploaded successfully')
  @UseInterceptors(
    FilesInterceptor(
      MULTIPLE_UPLOAD_FIELD_NAME,

      MAX_UPLOAD_FILE_COUNT,

      {
        storage: uploadToDisk({
          disk: R2_PRIVATE_DISK,

          contentTypes: [...ALLOWED_UPLOAD_CONTENT_TYPES],

          key: (file) => generateUploadKey(file.extension),
        }),

        limits: {
          fileSize: MAX_UPLOAD_FILE_SIZE,

          files: MAX_UPLOAD_FILE_COUNT,
        },
      },
    ),
  )
  uploadMultiple(
    @UploadedFiles()
    files: StoredUpload[],
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    return files.map(toUploadedFileResponse);
  }
}
