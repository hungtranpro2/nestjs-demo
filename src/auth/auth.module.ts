import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { LocalStrategy } from './passport/local.strategy.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './passport/jwt.strategy.js';
import ms, { type StringValue } from 'ms';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_ACCESS_TOKEN') || 'default_secret',
        signOptions: {
          expiresIn: ms(
            (configService.get<string>('JWT_ACCESS_EXPIRES') ||
              '1h') as StringValue,
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
