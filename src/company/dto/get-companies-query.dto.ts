import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CompanySortBy, CompanyStatus } from '../company.constants.js';

export class GetCompaniesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsEnum(CompanySortBy)
  sortBy: CompanySortBy = CompanySortBy.CREATED_AT;

  @IsOptional()
  @IsDateString({ strict: true, strictSeparator: true })
  createdFrom?: string;

  @IsOptional()
  @IsDateString({ strict: true, strictSeparator: true })
  createdTo?: string;
}
