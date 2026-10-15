import { Module } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { StorageModule } from '@nestjs/storage';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createStorageOptions } from './storage.config.js';
import { StorageTestController } from './storage-test.controller.js';

@Module({
  imports: [
    StorageModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return createStorageOptions(configService);
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [StorageTestController],
  providers: [StorageService],
  exports: [StorageService],
})
export class AppStorageModule {}
