import { ConfigService } from '@nestjs/config';
import { S3Disk, StorageModuleOptions } from '@nestjs/storage';
import { R2_DISK } from './storage.constants.js';

export function createStorageOptions(
  configService: ConfigService,
): StorageModuleOptions {
  const endpoint = configService.getOrThrow<string>('R2_ENDPOINT');

  const accessKeyId = configService.getOrThrow<string>('R2_ACCESS_KEY_ID');

  const secretAccessKey = configService.getOrThrow<string>(
    'R2_SECRET_ACCESS_KEY',
  );

  const bucket = configService.getOrThrow<string>('R2_BUCKET');
  return {
    default: R2_DISK,

    disks: {
      [R2_DISK]: new S3Disk({
        endpoint,

        region: 'auto',

        bucket,

        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }),
    },
  };
}
