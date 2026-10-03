import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import type { SoftDeleteModel } from '../common/plugins/soft-delete.plugin.js';
import { Company } from './schemas/company.schema.js';
import { IUser } from '../users/user.interface.js';
import { Types, type QueryFilter } from 'mongoose';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto.js';
import type {
  CompanyListRecord,
  CompanyResponse,
} from './dto/company-response.dto.js';
import { COMPANY_SORT_FIELDS } from './company.constants.js';
import { SortOrder } from '../common/dto/pagination-query.dto.js';
import type { PaginatedResponse } from '../common/interfaces/paginated-response.interface.js';
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
    // Implement the logic to create a new company using the provided DTO
    return await this.companyModel.create({
      ...createCompanyDto,
      createdBy: {
        _id: new Types.ObjectId(user._id),
        email: user.email,
      },
    });
  }

  async findAll(
    query: GetCompaniesQueryDto,
  ): Promise<PaginatedResponse<CompanyResponse>> {
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
        .select({
          _id: 1,
          name: 1,
          status: 1,
          address: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean<CompanyListRecord[]>()
        .exec(),
      this.companyModel.countDocuments(filter).exec(),
    ]);
    const data: CompanyResponse[] = companies.map((company) => ({
      _id: company._id.toString(),
      name: company.name,
      status: company.status,
      address: company.address,
      description: company.description,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }));
    return paginate(data, totalItems, page, limit);
  }

  findOne(id: number) {
    return `This action returns a #${id} company`;
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
          new: true,
          runValidators: true,
        },
      )
      .exec();

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
        { new: true },
      )
      .exec();

    return deletedCompany;
  }
}
