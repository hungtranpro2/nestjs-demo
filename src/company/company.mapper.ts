import type { FileAsset } from '../uploads/schemas/file-asset.schema.js';
import type {
  CompanyListItemRecord,
  CompanyListItemResponse,
  CompanyListRecord,
  CompanyLogoResponse,
  CompanyDocumentResponse,
} from './dto/company-response.dto.js';
import type {
  CompanyDetailRecord,
  CompanyDetailResponse,
} from './dto/company-response.dto.js';

export function toPublicCompany(company: CompanyListRecord): CompanyListRecord {
  return {
    _id: company._id,
    name: company.name,
    status: company.status,
    address: company.address,
    description: company.description,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

export function toCompanyDetail(
  company: CompanyDetailRecord,
  logoUrl: string | null,
): CompanyDetailResponse {
  return {
    id: company._id.toString(),

    name: company.name,
    status: company.status,
    address: company.address,
    description: company.description,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,

    logo: company.logo
      ? {
          id: company.logo.id,

          url: logoUrl!,

          originalName: company.logo.originalName,

          contentType: company.logo.contentType,

          size: company.logo.size,

          uploadedAt: company.logo.uploadedAt,
        }
      : null,
    documents: company.documents?.map((document) => ({
      id: document.id,
      originalName: document.originalName,
      contentType: document.contentType,
      size: document.size,
      uploadedAt: document.uploadedAt,
    })) ?? [],
  };
}

export function toCompanyListItem(
  company: CompanyListItemRecord,
  logoUrl: string | null,
): CompanyListItemResponse {
  return {
    id: company._id.toString(),

    name: company.name,
    status: company.status,
    address: company.address,
    description: company.description,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,

    logo: company.logo
      ? {
          id: company.logo.id,

          url: logoUrl!,

          originalName: company.logo.originalName,

          contentType: company.logo.contentType,

          size: company.logo.size,

          uploadedAt: company.logo.uploadedAt,
        }
      : null,
  };
}

export function toCompanyLogoResponse(
  file: FileAsset,
  url: string,
): CompanyLogoResponse {
  return {
    id: file.id,
    url,
    originalName: file.originalName,
    contentType: file.contentType,
    size: file.size,
    uploadedAt: file.uploadedAt,
  };
}

export function toCompanyDocumentResponse(file: FileAsset): CompanyDocumentResponse {
  return {
    id: file.id,
    originalName: file.originalName,
    contentType: file.contentType,
    size: file.size,
    uploadedAt: file.uploadedAt,
  };
}
