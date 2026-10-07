import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Error as MongooseError } from 'mongoose';
import type { ApiErrorResponse } from '../interfaces/api-response.interface.js';

const HTTP_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const response = host.switchToHttp().getResponse<unknown>();
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorResponse = {
      success: false,
      message: 'Internal server error',
      error: { code: 'INTERNAL_SERVER_ERROR' },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (status < 500) {
        const payload = exception.getResponse();
        const custom = isRecord(payload) ? payload : {};
        const message = typeof payload === 'string' ? payload : custom.message;
        const code =
          typeof custom.code === 'string'
            ? custom.code
            : (HTTP_ERROR_CODES[status] ?? 'HTTP_ERROR');
        body = {
          success: false,
          message: typeof message === 'string' ? message : 'Request failed',
          error: {
            code,
            ...(custom.details !== undefined
              ? { details: custom.details }
              : {}),
          },
        };
        if (Array.isArray(message)) {
          body.message = 'Validation failed';
          body.error = {
            code: 'VALIDATION_ERROR',
            details: message.filter(
              (item: unknown) => typeof item === 'string',
            ),
          };
        }
      }
    } else if (isRecord(exception) && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      body = {
        success: false,
        message: 'A record with this unique value already exists',
        error: { code: 'DUPLICATE_KEY' },
      };
    } else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      body = {
        success: false,
        message:
          exception.path === '_id'
            ? 'Invalid resource id'
            : 'Validation failed',
        error: {
          code: exception.path === '_id' ? 'INVALID_ID' : 'VALIDATION_ERROR',
          details: [{ field: exception.path, messages: ['Invalid value'] }],
        },
      };
    } else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      body = {
        success: false,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          details: Object.keys(exception.errors).map((field) => ({
            field,
            messages: ['Invalid value'],
          })),
        },
      };
    } else if (
      isRecord(exception) &&
      typeof exception.statusCode === 'number' &&
      exception.statusCode >= 400 &&
      exception.statusCode < 500
    ) {
      // HTTP adapter errors (for example malformed JSON or oversized bodies).
      status = exception.statusCode;
      body = {
        success: false,
        message: 'Invalid request',
        error: { code: HTTP_ERROR_CODES[status] ?? 'HTTP_ERROR' },
      };
    }

    if (status >= 500) {
      this.logger.error(
        'Unhandled API exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    if (!httpAdapter.isHeadersSent(response)) {
      httpAdapter.reply(response, body, status);
    } else {
      httpAdapter.end(response);
    }
  }
}
