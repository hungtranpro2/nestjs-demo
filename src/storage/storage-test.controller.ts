import { Controller, Get } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { Public } from '../decorator/customize.js';

@Public()
@Controller('storage-test')
export class StorageTestController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  async test() {
    const exists = await this.storageService.exists('__connection-test__');

    return {
      connected: true,
      objectExists: exists,
    };
  }
}
