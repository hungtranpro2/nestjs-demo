import { Document, Types } from 'mongoose';

const EXCLUDED_RESPONSE_FIELDS = new Set([
  'password',
  '__v',
  'isDeleted',
  'deletedAt',
]);

export function serializeResponseData(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (value instanceof Types.ObjectId) {
    return value.toHexString();
  }
  if (value instanceof Date) {
    return value.toJSON();
  }
  if (Buffer.isBuffer(value)) {
    return value.toJSON();
  }
  if (value instanceof Document) {
    const plain: unknown = value.toObject({
      flattenMaps: true,
      virtuals: false,
    });
    return serializeResponseData(plain);
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) => serializeResponseData(item));
  }
  if (value instanceof Map) {
    return serializeResponseData(Object.fromEntries(value));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !EXCLUDED_RESPONSE_FIELDS.has(key) &&
            !(key === '_id' && Object.hasOwn(value, 'id')),
        )
        .map(([key, item]) => [
          key === '_id' ? 'id' : key,
          serializeResponseData(item),
        ]),
    );
  }
  return value;
}
