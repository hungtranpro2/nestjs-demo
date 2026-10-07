import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import type { SoftDeleteModel } from '../common/plugins/soft-delete.plugin.js';
import { Company } from './schemas/company.schema.js';
import { IUser } from '../users/user.interface.js';
import { Types, type QueryFilter } from 'mongoose';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto.js';
import type { CompanyListRecord } from './dto/company-response.dto.js';
import {
  COMPANY_PUBLIC_FIELDS,
  COMPANY_SORT_FIELDS,
} from './company.constants.js';
import { toPublicCompany } from './company.mapper.js';
import { SortOrder } from '../common/dto/pagination-query.dto.js';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface.js';
import {
  getPaginationOffset,
  paginate,
} from '../common/utils/pagination.util.js';
import { escapeRegex } from '../common/utils/regex.util.js';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: SoftDeleteModel<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, user: IUser) {
    const company = await this.companyModel.create({
      ...createCompanyDto,
      createdBy: {
        _id: new Types.ObjectId(user._id),
        email: user.email,
      },
    });
    return toPublicCompany(company);
  }

  async findAll(
    query: GetCompaniesQueryDto,
  ): Promise<PaginatedResult<CompanyListRecord>> {
    const {
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
      createdFrom,
      createdTo,
    } = query;
    const skip = getPaginationOffset(page, limit);
    const filter: QueryFilter<Company> = { isDeleted: { $ne: true } };

    if (status) {
      filter.status = status;
    }

    if (createdFrom || createdTo) {
      const from = createdFrom ? new Date(createdFrom) : undefined;
      const to = createdTo ? new Date(createdTo) : undefined;
      if (
        (from && Number.isNaN(from.getTime())) ||
        (to && Number.isNaN(to.getTime()))
      ) {
        throw new BadRequestException('Invalid creation date');
      }
      if (from && to && from > to) {
        throw new BadRequestException(
          'createdFrom must be before or equal to createdTo',
        );
      }
      filter.createdAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    if (search?.trim()) {
      const keyword = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { address: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    const sortField = COMPANY_SORT_FIELDS[sortBy];
    const sortDirection = sortOrder === SortOrder.ASC ? 1 : -1;
    const [companies, totalItems] = await Promise.all([
      this.companyModel
        .find(filter)
        .sort({ [sortField]: sortDirection, _id: sortDirection })
        .skip(skip)
        .limit(limit)
        .select(COMPANY_PUBLIC_FIELDS)
        .lean<CompanyListRecord[]>()
        .exec(),
      this.companyModel.countDocuments(filter).exec(),
    ]);
    return paginate(companies, totalItems, page, limit);
  }

  async findOne(id: string) {
    const company = await this.companyModel
      .findOne({ _id: id })
      .select(COMPANY_PUBLIC_FIELDS)
      .lean<CompanyListRecord>()
      .exec();
    if (!company) {
      throw new NotFoundException({
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND',
      });
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: IUser) {
    const updatedCompany = await this.companyModel
      .findOneAndUpdate(
        { _id: id },
        {
          ...updateCompanyDto,
          updatedBy: { _id: new Types.ObjectId(user._id), email: user.email },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .select(COMPANY_PUBLIC_FIELDS)
      .lean<CompanyListRecord>()
      .exec();

    if (!updatedCompany) {
      throw new NotFoundException({
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND',
      });
    }
    return updatedCompany;
  }

  async remove(id: string, user: IUser) {
    const deletedCompany = await this.companyModel
      .findOneAndUpdate(
        { _id: id },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: { _id: new Types.ObjectId(user._id), email: user.email },
        },
        { returnDocument: 'after' },
      )
      .select('_id')
      .lean()
      .exec();

    if (!deletedCompany) {
      throw new NotFoundException({
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND',
      });
    }
    return null;
  }
}
