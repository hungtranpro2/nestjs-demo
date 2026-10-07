import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { IUser } from '../users/user.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<IUser | null> {
    const user = await this.usersService
      .findOneByEmail(email)
      .catch((error: unknown) => {
        if (error instanceof NotFoundException) {
          return null;
        }
        throw error;
      });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.isValidPassword(
      pass,
      user.password,
    );

    if (isPasswordValid) {
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };
    }
    return null;
  }

  login(user: IUser) {
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
