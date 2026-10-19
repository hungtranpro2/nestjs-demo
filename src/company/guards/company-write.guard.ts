import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import type { SoftDeleteModel } from '../../common/plugins/soft-delete.plugin.js';
import type { IUser } from '../../users/user.interface.js';

import { Company } from '../schemas/company.schema.js';

@Injectable()
export class CompanyWriteGuard implements CanActivate {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: SoftDeleteModel<Company>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: {
        id?: string;
      };

      user?: IUser;
    }>();

    const companyId = request.params.id;

    const user = request.user;

    if (!companyId || !Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException({
        message: 'Invalid company id',

        code: 'INVALID_COMPANY_ID',
      });
    }

    const company = await this.companyModel
      .findOne({
        _id: companyId,
      })
      .select({
        _id: 1,
        createdBy: 1,
      })
      .lean()
      .exec();

    if (!company) {
      throw new NotFoundException({
        message: 'Company not found',

        code: 'COMPANY_NOT_FOUND',
      });
    }

    if (!user) {
      throw new ForbiddenException({
        message: 'You are not allowed to modify this company',

        code: 'COMPANY_WRITE_FORBIDDEN',
      });
    }

    const ownerId = company.createdBy?._id?.toString();

    if (ownerId !== user._id) {
      throw new ForbiddenException({
        message: 'You are not allowed to modify this company',

        code: 'COMPANY_WRITE_FORBIDDEN',
      });
    }

    return true;
  }
}
