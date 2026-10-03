import type { Types } from 'mongoose';
import type { Company } from '../schemas/company.schema.js';

export type CompanyListRecord = Pick<
  Company,
  'name' | 'status' | 'address' | 'description' | 'createdAt' | 'updatedAt'
> & { _id: Types.ObjectId };

export type CompanyResponse = Omit<CompanyListRecord, '_id'> & { _id: string };
