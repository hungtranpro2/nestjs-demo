import type { CompanyListRecord } from './dto/company-response.dto.js';

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
