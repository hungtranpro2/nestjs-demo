import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ResponseMessage('User created successfully')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ResponseMessage('Users retrieved successfully')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ResponseMessage('User retrieved successfully')
  findOne(@Param('id', new MongoIdPipe('user')) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('User updated successfully')
  update(
    @Param('id', new MongoIdPipe('user')) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/restore')
  @ResponseMessage('User restored successfully')
  restore(@Param('id', new MongoIdPipe('user')) id: string) {
    return this.usersService.restore(id);
  }

  @Delete(':id')
  @ResponseMessage('User deleted successfully')
  remove(@Param('id', new MongoIdPipe('user')) id: string) {
    return this.usersService.remove(id);
  }
}
