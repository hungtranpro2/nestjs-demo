import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard.js';
import { AuthService } from './auth.service.js';
import { User } from '../users/schemas/user.schema.js';
import { Public } from '../decorator/customize.js';
import { IUser } from '../users/user.interface.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  handleLogin(@Request() req): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.authService.login(req?.user as IUser); // Call the login method from AuthService to generate a JWT token
  }

  @Get('profile')
  getProfile(@Request() req: { user: IUser }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return req.user;
  }
}
