import { Module } from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { CompanyController } from './company.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './schemas/company.schema.js';
import { AppStorageModule } from '../storage/storage.module.js';
import { CompanyWriteGuard } from './guards/company-write.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    AppStorageModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService, CompanyWriteGuard],
})
export class CompanyModule {}
