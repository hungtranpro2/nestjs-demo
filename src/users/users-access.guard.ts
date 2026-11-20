import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { SoftDeleteModel } from '../common/plugins/soft-delete.plugin.js';
import type { IUser } from './user.interface.js';
import { User } from './schemas/user.schema.js';

type UsersPermission = 'ADMIN' | 'SELF_OR_ADMIN';
const USERS_PERMISSION_KEY = 'users_permission';
export const UsersPermission = (level: UsersPermission) =>
  SetMetadata(USERS_PERMISSION_KEY, level);

@Injectable()
export class UsersAccessGuard implements CanActivate {
  constructor(
    @InjectModel(User.name)
    private readonly users: SoftDeleteModel<User>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<UsersPermission>(
      USERS_PERMISSION_KEY,
      context.getHandler(),
    );
    if (!required) {
      throw new ForbiddenException('Missing users access policy');
    }
    const req = context.switchToHttp().getRequest<{
      user?: IUser;
      params: { id?: string };
    }>();
    const actorId = req.user?._id;
    if (!actorId || !Types.ObjectId.isValid(actorId)) {
      throw new UnauthorizedException();
    }

    // Read the current role from MongoDB instead of trusting a potentially
    // stale role claim in the access token.
    const actor = await this.users
      .findOne({ _id: actorId })
      .select({ role: 1 })
      .lean()
      .exec();
    if (!actor) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (actor.role === 'ADMIN') return true;
    if (required === 'SELF_OR_ADMIN' && actorId === req.params.id) return true;

    throw new ForbiddenException({
      message: 'You are not allowed to access this user',
      code: 'USER_ACCESS_FORBIDDEN',
    });
  }
}
