import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { CompanyStatus } from '../company.constants.js';

export class CreateCompanyDto {
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsNotEmpty({ message: 'Address is required' })
  address!: string;

  @IsNotEmpty({ message: 'Description is required' })
  description!: string;
}
