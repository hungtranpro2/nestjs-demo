import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/schemas/user.schema.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<null | Omit<User, 'password'>> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.isValidPassword(
      pass,
      user.password,
    );

    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: Omit<User, 'password'>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = { username: user.email, sub: user.name };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
