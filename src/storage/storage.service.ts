import { Injectable, Logger } from '@nestjs/common';

import { InjectDisk, StorageDisk } from '@nestjs/storage';
import { R2_DISK } from './storage.constants.js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @InjectDisk(R2_DISK)
    private readonly storage: StorageDisk,
  ) {}

  exists(key: string): Promise<boolean> {
    return this.storage.exists(key);
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    await this.storage.delete(keys);
  }

  async safeDelete(key?: string | null): Promise<void> {
    if (!key) {
      return;
    }

    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete storage object: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async safeDeleteMany(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    try {
      await this.storage.delete(keys);
    } catch (error) {
      this.logger.error(
        `Failed to delete storage objects: ${keys.join(', ')}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
