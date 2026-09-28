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
import { isValidObjectId, Model } from 'mongoose';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async hashPassword(password: string): Promise<string> {
    // Implement your password hashing logic here

    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);

    return hash; // Placeholder, replace with actual hashing
  }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await this.hashPassword(createUserDto.password);
    const userWithHashedPassword = {
      ...createUserDto,
      password: hashedPassword,
    };
    return this.userModel.create(userWithHashedPassword);
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`ID không hợp lệ: ${id}`);
    }

    const user = await this.userModel.findOne({ _id: id }).exec();
    if (!user) {
      throw new BadRequestException(`User not found with ID: ${id}`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, {
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
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

    // 3. Nếu không tìm thấy user để xóa -> ném lỗi 404
    if (!deletedUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    return {
      message: 'Xóa người dùng thành công',
      deletedUser,
    };
    return `This action removes a #${id} user`;
  }
}
