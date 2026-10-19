import { ConfigService } from '@nestjs/config';
import { S3Disk, type StorageModuleOptions } from '@nestjs/storage';
import { R2_PRIVATE_DISK, R2_PUBLIC_DISK } from './storage.constants.js';

export function createStorageOptions(
  configService: ConfigService,
): StorageModuleOptions {
  const endpoint = configService.getOrThrow<string>('R2_ENDPOINT');
  const credentials = {
    accessKeyId: configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
    secretAccessKey: configService.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
  };

  return {
    default: R2_PRIVATE_DISK,
    disks: {
      [R2_PUBLIC_DISK]: new S3Disk({
        endpoint,
        region: 'auto',
        credentials,
        bucket: configService.getOrThrow<string>('R2_PUBLIC_BUCKET'),
        publicUrl: configService.getOrThrow<string>('R2_PUBLIC_URL'),
      }),
      [R2_PRIVATE_DISK]: new S3Disk({
        endpoint,
        region: 'auto',
        credentials,
        bucket: configService.getOrThrow<string>('R2_PRIVATE_BUCKET'),
      }),
    },
  };
}
