import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema.js';
import { isValidObjectId } from 'mongoose';
import bcrypt from 'bcrypt';
import type { SoftDeleteModel } from '../common/plugins/soft-delete.plugin.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<User>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    // Implement your password hashing logic here

    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);

    return hash; // Placeholder, replace with actual hashing
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .select('_id')
      .lean();

    if (existingUser) {
      throw new ConflictException({
        message: 'User email already exists',
        code: 'USER_EMAIL_ALREADY_EXISTS',
      });
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const userWithHashedPassword = {
      ...createUserDto,
      password: hashedPassword,
    };

    return this.userModel.create(userWithHashedPassword);
  }

  findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`ID không hợp lệ: ${id}`);
    }

    const user = await this.userModel.findOne({ _id: id }).exec();
    if (!user) {
      throw new NotFoundException(`User not found with ID: ${id}`);
    }
    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .lean();

    if (!user) {
      throw new NotFoundException(`User not found with email: ${email}`);
    }
    return user;
  }

  async isValidPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: id }, updateUserDto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException({
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
    return updatedUser;
  }

  async remove(id: string) {
    // 1. Kiểm tra ID có đúng định dạng MongoDB ObjectId không
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`ID không hợp lệ: ${id}`);
    }

    // 2. Tìm và xóa bản ghi
    const deletedUser = await this.userModel.softDeleteById(id);

    // 3. Nếu không tìm thấy user để xóa -> ném lỗi 404
    if (!deletedUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    return null;
  }

  async restore(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`ID không hợp lệ: ${id}`);
    }

    const restoredUser = await this.userModel.restoreById(id);

    if (!restoredUser) {
      throw new NotFoundException(
        `Không tìm thấy người dùng đã xóa với ID: ${id}`,
      );
    }

    return restoredUser;
  }
}
