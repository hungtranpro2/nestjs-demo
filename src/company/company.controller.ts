import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import type { IUser } from '../users/user.interface.js';
import { User } from '../decorator/customize.js';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe.js';

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
}
