import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { isObjectIdOrHexString } from 'mongoose';

@Injectable()
export class MongoIdPipe implements PipeTransform<string, string> {
  constructor(private readonly resource = 'resource') {}

  transform(value: string): string {
    if (!isObjectIdOrHexString(value)) {
      throw new BadRequestException({
        message: `Invalid ${this.resource} id`,
        code: `INVALID_${this.resource.toUpperCase()}_ID`,
      });
    }
    return value;
  }
}
