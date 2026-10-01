import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
      throw new ConflictException(
        `Email ${createUserDto.email} đã tồn tại trong hệ thống.`,
      );
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const userWithHashedPassword = {
      ...createUserDto,
      password: hashedPassword,
    };

    try {
      return await this.userModel.create(userWithHashedPassword);
    } catch (error: any) {
      // Unique index vẫn cần được xử lý vì hai request có thể chạy đồng thời.
      if (error.code === 11000) {
        throw new ConflictException(
          `Email ${createUserDto.email} đã tồn tại trong hệ thống.`,
        );
      }

      throw error;
    }
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

    console.log(user);

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
    try {
      const updatedUser = await this.userModel
        .findOneAndUpdate({ _id: id }, updateUserDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
      }

      return updatedUser;
    } catch (error: any) {
      // 1. Bắt mã lỗi trùng lặp duy nhất E11000 từ MongoDB Driver
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 11000) {
        const duplicateField =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          Object.keys(error.keyPattern || {})[0] || 'Dữ liệu';
        throw new ConflictException(
          `${duplicateField} này đã tồn tại trong hệ thống.`,
        );
      }

      // 2. Ném tiếp các Exception chuẩn của NestJS (như NotFoundException ở trên)
      if (error instanceof NotFoundException) {
        throw error;
      }

      // 3. Các lỗi ngoại lệ ngoài ý muốn khác
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi khi cập nhật dữ liệu.',
      );
    }
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

    return {
      message: 'Xóa người dùng thành công',
      deletedUser,
    };
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

    return {
      message: 'Khôi phục người dùng thành công',
      restoredUser,
    };
  }
}
