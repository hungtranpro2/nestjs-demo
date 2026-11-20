import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe.js';
import { UsersAccessGuard, UsersPermission } from './users-access.guard.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsersPermission('ADMIN')
  @UseGuards(UsersAccessGuard)
  @ResponseMessage('User created successfully')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UsersPermission('ADMIN')
  @UseGuards(UsersAccessGuard)
  @ResponseMessage('Users retrieved successfully')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UsersPermission('SELF_OR_ADMIN')
  @UseGuards(UsersAccessGuard)
  @ResponseMessage('User retrieved successfully')
  findOne(@Param('id', new MongoIdPipe('user')) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UsersPermission('SELF_OR_ADMIN')
  @UseGuards(UsersAccessGuard)
  @ResponseMessage('User updated successfully')
  update(
    @Param('id', new MongoIdPipe('user')) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/restore')
  @UsersPermission('ADMIN')
  @UseGuards(UsersAccessGuard)
  @ResponseMessage('User restored successfully')
  restore(@Param('id', new MongoIdPipe('user')) id: string) {
    return this.usersService.restore(id);
  }

  @Delete(':id')
  @UsersPermission('SELF_OR_ADMIN')
  @UseGuards(UsersAccessGuard)
  @ResponseMessage('User deleted successfully')
  remove(@Param('id', new MongoIdPipe('user')) id: string) {
    return this.usersService.remove(id);
  }
}
