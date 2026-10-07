import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CompanyStatus } from '../company.constants.js';

export class CreateCompanyDto {
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name!: string;

  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  address!: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description!: string;
}
