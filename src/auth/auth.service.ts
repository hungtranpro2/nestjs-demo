import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/schemas/user.schema.js';
import { JwtService } from '@nestjs/jwt';
import { IUser } from '../users/user.interface.js';

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

  login(user: IUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { _id, name, email, role } = user;
    const payload = {
      name,
      sub: 'token login',
      role,
      email,
      _id,
      iss: 'from server',
    };
    return {
      access_token: this.jwtService.sign(payload),
      _id,
      name,
      email,
      role,
    };
  }
}
