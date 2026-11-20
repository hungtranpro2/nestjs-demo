import { ConfigService } from '@nestjs/config';
import { S3Disk, type StorageModuleOptions } from '@nestjs/storage';
import { R2_PRIVATE_DISK, R2_PUBLIC_DISK } from './storage.constants.js';

export function createStorageOptions(
  configService: ConfigService,
): StorageModuleOptions {
  const endpoint = configService.getOrThrow<string>('R2_ENDPOINT');
  const publicBucket = configService.getOrThrow<string>('R2_PUBLIC_BUCKET');
  const privateBucket = configService.getOrThrow<string>('R2_PRIVATE_BUCKET');
  if (!publicBucket || !privateBucket || publicBucket === privateBucket) {
    throw new Error('Public and private R2 buckets must be different non-empty buckets');
  }
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
        bucket: publicBucket,
        publicUrl: configService.getOrThrow<string>('R2_PUBLIC_URL'),
      }),
      [R2_PRIVATE_DISK]: new S3Disk({
        endpoint,
        region: 'auto',
        credentials,
        bucket: privateBucket,
      }),
    },
  };
}
