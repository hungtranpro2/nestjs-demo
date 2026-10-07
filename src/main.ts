import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { formatValidationErrors } from './common/utils/validation-error.util.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formatValidationErrors(errors),
        }),
    }),
  );

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
