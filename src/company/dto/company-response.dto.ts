import type { Types } from 'mongoose';
import type { Company } from '../schemas/company.schema.js';
import { FileAsset } from '../../uploads/schemas/file-asset.schema.js';

export type CompanyListRecord = Pick<
  Company,
  'name' | 'status' | 'address' | 'description' | 'createdAt' | 'updatedAt'
> & { _id: Types.ObjectId };

export type CompanyResponse = Omit<CompanyListRecord, '_id'> & { id: string };

export type CompanyDetailRecord = CompanyListRecord & {
  logo?: FileAsset;
};

export type CompanyLogoResponse = {
  id: string;
  url: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
};

export type CompanyDetailResponse = Omit<CompanyListRecord, '_id'> & {
  id: string;
  logo: CompanyLogoResponse | null;
};

export type CompanyListItemRecord = CompanyListRecord & {
  logo?: FileAsset;
};

export type CompanyListItemResponse = Omit<CompanyListRecord, '_id'> & {
  id: string;
  logo: CompanyLogoResponse | null;
};
