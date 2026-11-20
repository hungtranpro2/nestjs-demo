import { Injectable, Logger } from '@nestjs/common';
import { InjectDisk, StorageDisk } from '@nestjs/storage';
import { R2_PRIVATE_DISK, R2_PUBLIC_DISK } from './storage.constants.js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @InjectDisk(R2_PUBLIC_DISK)
    private readonly publicStorage: StorageDisk,
    @InjectDisk(R2_PRIVATE_DISK)
    private readonly privateStorage: StorageDisk,
  ) {}

  getPublicUrl(key: string): string {
    return this.publicStorage.url(key);
  }

  async getPrivateDocumentUrl(
    key: string,
    filename: string,
    disposition: 'inline' | 'attachment' = 'attachment',
  ): Promise<string> {
    return this.privateStorage.signedUrl(key, {
      expiresIn: '5m',
      filename,
      disposition,
    });
  }

  // Only used by the development connectivity check.
  exists(key: string): Promise<boolean> {
    return this.privateStorage.exists(key);
  }

  async safeDeletePublic(key?: string | null): Promise<void> {
    if (!key) return;
    try {
      await this.publicStorage.delete(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete public object: ${key}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async safeDeletePrivate(key?: string | null): Promise<void> {
    if (!key) return;
    try {
      await this.privateStorage.delete(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete private object: ${key}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async safeDeletePrivateMany(keys: string[]): Promise<void> {
    // Per-key cleanup avoids treating a partially successful bulk deletion
    // as if every object was removed.
    await Promise.all(keys.map((key) => this.safeDeletePrivate(key)));
  }
}
