import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard.js';
import { AuthService } from './auth.service.js';
import { Public } from '../decorator/customize.js';
import type { IUser } from '../users/user.interface.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ResponseMessage('Logged in successfully')
  handleLogin(@Request() req: { user: IUser }) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  @ResponseMessage('Profile retrieved successfully')
  getProfile(@Request() req: { user: IUser }) {
    return req.user;
  }
}
