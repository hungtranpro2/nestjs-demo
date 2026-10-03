# Companies API

```http
GET /companies?page=1&limit=10&search=logistics&status=ACTIVE&sortBy=createdAt&sortOrder=desc
```

The route uses the existing global JWT guard and requires a Bearer access token.

| Query         | Default     | Accepted values                                                |
| ------------- | ----------- | -------------------------------------------------------------- |
| `page`        | `1`         | Positive safe integer; the calculated offset must also be safe |
| `limit`       | `10`        | Integer from `1` to `100`                                      |
| `search`      | None        | String, up to 200 characters                                   |
| `status`      | None        | `ACTIVE`, `INACTIVE`                                           |
| `sortBy`      | `createdAt` | `name`, `createdAt`, `updatedAt`                               |
| `sortOrder`   | `desc`      | `asc`, `desc`                                                  |
| `createdFrom` | None        | ISO date; inclusive lower bound for `createdAt`                |
| `createdTo`   | None        | ISO date; inclusive upper bound for `createdAt`                |

Use full ISO timestamps with a timezone for precise date bounds:

```http
GET /companies?createdFrom=2026-01-01T00:00:00.000Z&createdTo=2026-12-31T23:59:59.999Z
```

Invalid query values, unknown query fields, unsafe pagination offsets, and
`createdFrom > createdTo` return HTTP `400`. The global ValidationPipe also rejects
unknown DTO properties on other routes.

Search matches literal, case-insensitive substrings of `name`, `address`, or `description`.
Input is trimmed and regex special characters are escaped. Blank search is ignored.
Search, status, date bounds, and the existing soft-delete filter are combined with
AND. Sorting always adds `_id` as a tie-breaker in the requested direction.

## Response

```json
{
  "result": [
    {
      "_id": "68ce58300000000000000001",
      "name": "DHL Express",
      "status": "ACTIVE",
      "address": "Hanoi",
      "description": "Logistics company",
      "createdAt": "2026-09-20T08:30:00.000Z",
      "updatedAt": "2026-09-25T10:15:00.000Z"
    }
  ],
  "meta": {
    "current": 1,
    "pageSize": 10,
    "total": 1,
    "pages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

`_id` remains the public identifier, serialized as a string. Only the public fields
above are selected; audit fields, deletion fields, and `__v` are excluded.
The common pagination response uses `result` and
`current/pageSize/total/pages` to match the frontend contract. Requests still use
`page` and `limit` as query parameters.

No matches return HTTP `200`, `result: []`, zero totals, and both navigation flags
`false`. A page beyond the last page returns empty data and preserves the requested
page. `hasNextPage` is `false`; `hasPreviousPage` is `true` when the result set has
pages and the requested page exceeds `1`.

## Schema and indexes

`status` accepts the two enum values and defaults to `ACTIVE` for new documents.
It can also be supplied to the existing create/update endpoints.

Old documents are not backfilled. Missing optional fields are omitted from JSON;
an old document without `status` will not match `status=ACTIVE` or `status=INACTIVE`.

The schema declares compound indexes for the default sort and the status filter:

```text
{ createdAt: -1, _id: -1 }
{ status: 1, createdAt: -1, _id: -1 }
```

These complement the existing soft-delete index. They must be created in MongoDB
through the project's normal index deployment policy (or Mongoose autoIndex when
enabled); declaring them does not migrate existing records.

List queries use `lean()` and execute data/count queries concurrently with the same
filter. The two reads do not provide a transactional snapshot, so concurrent writes
can change the total between reads.

Contains regex search may scan many documents despite these indexes. For large
datasets, consider a dedicated search solution. Offset pagination also becomes more
expensive at high page numbers; cursor pagination can be added for infinite scroll
when needed.

## Reuse in another list API

1. Extend `common/dto/pagination-query.dto.ts` with that module's validated search,
   filter, and sort-field properties.
2. Define a whitelist mapping for that module's sort fields.
3. Build its business filter in its own service.
4. Call `getPaginationOffset(page, limit)`, then execute the sorted, projected,
   lean query and matching count with `Promise.all()`.
5. Map public fields and return `paginate(data, totalItems, page, limit)` with
   `PaginatedResponse<ResponseDto>` as the return type.

`PaginationMeta`, `PaginatedResponse<T>`, `SortOrder`, `paginate()`,
`getPaginationOffset()`, and `escapeRegex()` live in `common`. No base CRUD service
is needed. Other list APIs have not been changed by this implementation.
