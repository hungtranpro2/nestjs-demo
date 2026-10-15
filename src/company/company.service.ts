/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  ConflictException,
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
import { StoredUpload } from '@nestjs/storage';
import { toFileAsset } from './utils/company-file.util.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: SoftDeleteModel<Company>,
    private readonly storageService: StorageService,
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

  async createLogo(companyId: string, file: StoredUpload) {
    const logo = toFileAsset(file);

    let company;

    try {
      company = await this.companyModel
        .findOneAndUpdate(
          {
            _id: companyId,

            $or: [
              {
                logo: {
                  $exists: false,
                },
              },
              {
                logo: null,
              },
            ],
          },

          {
            $set: {
              logo,
            },
          },

          {
            new: true,
          },
        )
        .lean()
        .exec();
    } catch (error) {
      await this.storageService.safeDelete(file.key);

      throw error;
    }

    if (company) {
      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: company._id.toString(),

        logo,
      };
    }

    // Update không xảy ra:
    // company không tồn tại HOẶC
    // company đã có logo.

    await this.storageService.safeDelete(file.key);

    const companyExists = await this.companyModel.exists({
      _id: companyId,
    });

    if (!companyExists) {
      throw new NotFoundException({
        message: 'Company not found',

        code: 'COMPANY_NOT_FOUND',
      });
    }

    throw new ConflictException({
      message: 'Company already has a logo',

      code: 'COMPANY_LOGO_ALREADY_EXISTS',
    });
  }

  async replaceLogo(companyId: string, file: StoredUpload) {
    const newLogo = toFileAsset(file);

    let previousCompany;

    try {
      previousCompany = await this.companyModel
        .findByIdAndUpdate(
          companyId,

          {
            $set: {
              logo: newLogo,
            },
          },

          {
            new: false,
          },
        )
        .lean()
        .exec();
    } catch (error) {
      await this.storageService.safeDelete(file.key);

      throw error;
    }

    if (!previousCompany) {
      await this.storageService.safeDelete(file.key);

      throw new NotFoundException({
        message: 'Company not found',

        code: 'COMPANY_NOT_FOUND',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const previousLogoKey = previousCompany.logo?.key;

    if (previousLogoKey && previousLogoKey !== file.key) {
      await this.storageService.safeDelete(previousLogoKey);
    }

    return {
      id: companyId,
      logo: newLogo,
    };
  }

  async addDocuments(companyId: string, files: StoredUpload[]) {
    const documents = files.map(toFileAsset);

    const keys = files.map((file) => file.key);

    let company;

    try {
      company = await this.companyModel
        .findByIdAndUpdate(
          companyId,

          {
            $push: {
              documents: {
                $each: documents,
              },
            },
          },

          {
            new: true,
          },
        )
        .lean()
        .exec();
    } catch (error) {
      await this.storageService.safeDeleteMany(keys);

      throw error;
    }

    if (!company) {
      await this.storageService.safeDeleteMany(keys);

      throw new NotFoundException({
        message: 'Company not found',

        code: 'COMPANY_NOT_FOUND',
      });
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: company._id.toString(),

      documents,
    };
  }
}
