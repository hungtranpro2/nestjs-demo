import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import type { IUser } from '../users/user.interface.js';
import { User } from '../decorator/customize.js';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe.js';
import {
  COMPANY_DOCUMENT_FIELD,
  COMPANY_DOCUMENT_TYPES,
  COMPANY_LOGO_FIELD,
  COMPANY_LOGO_TYPES,
  MAX_COMPANY_DOCUMENT_COUNT,
  MAX_COMPANY_DOCUMENT_SIZE,
  MAX_COMPANY_LOGO_SIZE,
} from './uploads/company-upload.constants.js';
import { StoredUpload, uploadToDisk } from '@nestjs/storage';
import { R2_DISK } from '../storage/storage.constants.js';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  generateCompanyDocumentKey,
  generateCompanyLogoKey,
} from './utils/company-upload-key.util.js';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ResponseMessage('Company created successfully')
  create(@Body() createCompanyDto: CreateCompanyDto, @User() user: IUser) {
    return this.companyService.create(createCompanyDto, user);
  }

  @Get()
  @ResponseMessage('Companies retrieved successfully')
  findAll(@Query() query: GetCompaniesQueryDto) {
    return this.companyService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Company retrieved successfully')
  findOne(@Param('id', new MongoIdPipe('company')) id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Company updated successfully')
  update(
    @Param('id', new MongoIdPipe('company')) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @User() user: IUser,
  ) {
    return this.companyService.update(id, updateCompanyDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Company deleted successfully')
  remove(
    @Param('id', new MongoIdPipe('company')) id: string,
    @User() user: IUser,
  ) {
    return this.companyService.remove(id, user);
  }

  @Post(':id/logo')
  @ResponseMessage('Company logo uploaded successfully')
  @UseInterceptors(
    FileInterceptor(COMPANY_LOGO_FIELD, {
      storage: uploadToDisk({
        disk: R2_DISK,

        contentTypes: [...COMPANY_LOGO_TYPES],

        key: (file) => generateCompanyLogoKey(file.extension),
      }),

      limits: {
        fileSize: MAX_COMPANY_LOGO_SIZE,

        files: 1,
      },
    }),
  )
  createLogo(
    @Param('id')
    companyId: string,

    @UploadedFile()
    file: StoredUpload | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }

    return this.companyService.createLogo(companyId, file);
  }

  @Patch(':id/logo')
  @ResponseMessage('Company logo updated successfully')
  @UseInterceptors(
    FileInterceptor(COMPANY_LOGO_FIELD, {
      storage: uploadToDisk({
        disk: R2_DISK,

        contentTypes: [...COMPANY_LOGO_TYPES],

        key: (file) => generateCompanyLogoKey(file.extension),
      }),

      limits: {
        fileSize: MAX_COMPANY_LOGO_SIZE,

        files: 1,
      },
    }),
  )
  replaceLogo(
    @Param('id')
    companyId: string,

    @UploadedFile()
    file: StoredUpload | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }

    return this.companyService.replaceLogo(companyId, file);
  }

  @Post(':id/documents')
  @ResponseMessage('Company documents uploaded successfully')
  @UseInterceptors(
    FilesInterceptor(
      COMPANY_DOCUMENT_FIELD,

      MAX_COMPANY_DOCUMENT_COUNT,

      {
        storage: uploadToDisk({
          disk: R2_DISK,

          contentTypes: [...COMPANY_DOCUMENT_TYPES],

          key: (file) => generateCompanyDocumentKey(file.extension),
        }),

        limits: {
          fileSize: MAX_COMPANY_DOCUMENT_SIZE,

          files: MAX_COMPANY_DOCUMENT_COUNT,
        },
      },
    ),
  )
  addDocuments(
    @Param('id')
    companyId: string,

    @UploadedFiles()
    files: StoredUpload[],
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one document is required');
    }

    return this.companyService.addDocuments(companyId, files);
  }
}
