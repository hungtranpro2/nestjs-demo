# HTTP response transformation

`ApiResponseInterceptor` is registered globally with `APP_INTERCEPTOR` in
`AppModule`. Controllers and services continue returning business data; the
interceptor serializes it and applies the response contract at the HTTP boundary.

## Success responses

Ordinary values, objects, and arrays use one success envelope:

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "68ce58300000000000000001",
    "name": "Example"
  }
}
```

A non-paginated list has `data: []`. A null or undefined return value becomes
`data: null`. Metadata is omitted for ordinary responses. HTTP status codes are
preserved, including Nest's default `201` for POST and `200` for DELETE.
If a route explicitly uses `204` or `304`, the interceptor returns no body.

Services return `PaginatedResult<T>` as `{ items, meta }`; the interceptor flattens
the items into `data` and leaves metadata alongside it:

```json
{
  "success": true,
  "message": "Companies retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Use `paginate()` to build the internal contract. `isPaginatedResult()` checks an
array `items` and all six typed metadata fields. Controllers and services must
return business data directly rather than build an HTTP envelope. Only the global
interceptor builds `success/message/data/meta`, avoiding nested `data.data` or
`data.items`.

Use `@ResponseMessage('Company created successfully')` on a controller method or
class to set the success message. Method metadata takes precedence over class
metadata. The fallback is `Success`. Services do not set success messages.

All ordinary HTTP success endpoints now use this envelope, including auth login,
profile, user create/update/delete, and the root route. For example, the frontend
must read the login token from `response.data.access_token` instead of
`response.access_token` (or the equivalent path beneath its HTTP client's body).
Company list clients read `response.data` and `response.meta`. This replaces the
previous `result` contract; metadata keys are now `page/limit/totalItems/totalPages`
instead of `current/pageSize/total/pages`. JSON identifiers are now `id`, not `_id`.
No frontend source is included in this repository; clients must migrate separately.

## Serialization

`serializeResponseData()` handles nested objects and arrays, Mongoose documents,
and lean results without changing the original business data:

- Documents are converted to plain objects with maps flattened and virtuals off.
- ObjectIds become hexadecimal strings; `_id` is renamed to `id` recursively.
  An existing explicit `id` takes precedence if both names are present.
- Dates become ISO strings, matching normal JSON date serialization.
- `password`, `__v`, `isDeleted`, and `deletedAt` properties are omitted recursively, including newly created
  user documents where `select: false` alone does not remove the password.
- Other fields are preserved. Keep explicit projection/response DTOs for each
  module's public contract; the global serializer is not a whitelist of every
  possible secret field.

## Error responses

`ApiExceptionFilter` is registered globally with `APP_FILTER`. The success
interceptor does not catch exceptions. All HTTP exceptions and unexpected errors
use one error contract with the correct failure status:

```json
{
  "success": false,
  "message": "Company not found",
  "error": { "code": "COMPANY_NOT_FOUND" }
}
```

- Business HTTP exceptions can include `message`, `code`, and optional `details`.
- Global ValidationPipe failures return `400`, `VALIDATION_ERROR`, and field-level
  `details: [{ field, messages }]`, including nested property paths. Input values
  and validation targets are excluded.
- Mongo duplicate key errors return `409`, `DUPLICATE_KEY`, and a safe message.
  The existing user email pre-check uses `USER_EMAIL_ALREADY_EXISTS`; a racing
  write that hits the unique index is handled by the generic duplicate key case.
- MongoIdPipe returns `400`, `INVALID_COMPANY_ID` or `INVALID_USER_ID`, before a
  route queries MongoDB. Mongoose cast errors are also normalized defensively.
- Mongoose document validation failures return `400` with safe field details.
- Unauthorized/forbidden exceptions retain `401`/`403` and default to the codes
  `UNAUTHORIZED`/`FORBIDDEN` unless a business exception supplies a custom code.
- Unexpected errors return `500`, `INTERNAL_SERVER_ERROR`. Errors with a server
  failure status never expose their original message, details, stack, or database
  information to clients. The original exception is logged on the server.

Company detail/update/delete use `COMPANY_NOT_FOUND` with HTTP `404` when the active
document does not exist. Deleted companies are excluded by the existing plugin.
Company and user DELETE return null business data, which becomes a success response
with `data: null` and HTTP `200`.

## Direct responses

`StreamableFile` and top-level Buffer responses bypass transformation. Other
endpoints that intentionally need a direct body can opt out at method or controller
level:

```ts
import { SkipResponseTransform } from './common/decorators/skip-response-transform.decorator.js';

@SkipResponseTransform()
@Get('raw')
raw() {
  return { custom: 'contract' };
}
```

Opting out bypasses both wrapping and field sanitization. Avoid opting out on routes
that return user documents. Routes that write through `@Res()` directly also bypass
Nest response mapping; use normal return values for JSON APIs. For downloads, use
`StreamableFile`.

The interceptor only applies to HTTP contexts. Services can still reuse their
unwrapped data internally, and WebSocket/RPC responses are not transformed.
