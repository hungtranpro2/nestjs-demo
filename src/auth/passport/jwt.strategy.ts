/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IUser } from '../../users/user.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_TOKEN'),
      issuer: 'nestjs-demo',
      audience: 'nestjs-demo-api',
      algorithms: ['HS256'],
    });
  }

  validate(payload: { sub: string; name: string; email: string; role: string }): IUser {
    const { sub, name, email, role } = payload;
    return { _id: sub, name, email, role };
  }
}
