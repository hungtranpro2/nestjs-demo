import {
  Injectable,
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import { SKIP_RESPONSE_TRANSFORM } from '../decorators/skip-response-transform.decorator.js';
import type { ApiResponse } from '../interfaces/api-response.interface.js';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';
import { isPaginatedResult } from '../utils/pagination.util.js';
import { serializeResponseData } from '../utils/serialize-response.util.js';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor<
  unknown,
  unknown
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_TRANSFORM,
      [context.getHandler(), context.getClass()],
    );
    if (context.getType() !== 'http' || skip) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Success';
    return next.handle().pipe(
      map((data: unknown) => {
        if (response.statusCode === 204 || response.statusCode === 304) {
          return undefined;
        }
        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data;
        }
        if (isPaginatedResult(data)) {
          const body: ApiResponse<unknown> = {
            success: true,
            message,
            data: serializeResponseData(data.items),
            meta: data.meta,
          };
          return body;
        }
        const body: ApiResponse<unknown> = {
          success: true,
          message,
          data: serializeResponseData(data) ?? null,
        };
        return body;
      }),
    );
  }
}
