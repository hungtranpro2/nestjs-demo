# Storage and access-control migration

This branch is a **breaking configuration change** from one R2 disk to two.
It does not provision Cloudflare resources or move files automatically.

## Cloudflare R2

1. Create two **different** buckets: a public asset bucket and a private documents bucket.
2. Enable Public Development URL (development) or a custom public domain **only on the public bucket**.
3. Keep Public Development URL and public custom domains **disabled** on the private bucket.
4. Grant the S3 credentials access to both intended buckets; scope credentials as narrowly as possible.
5. Set the values below in your local (untracked) `.env`:

```dotenv
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_BUCKET=nestjs-demo-public
R2_PRIVATE_BUCKET=nestjs-demo-private
R2_PUBLIC_URL=https://pub-<PUBLIC_ID>.r2.dev

JWT_ACCESS_TOKEN=<STRONG_RANDOM_SECRET>
JWT_ACCESS_EXPIRES=15m
CLIENT_ORIGIN=http://localhost:3000
```

**Existing files do not migrate automatically.** Move/copy existing logos to the new public bucket and PDFs to the new private bucket, preserving keys and metadata. In a demo project you can delete old test PDFs and upload again. **Remove private PDFs from the old publicly accessible bucket**: disabling public access or deleting them is necessary, otherwise those old files remain reachable via the previous public URL. Do not assume a signed URL makes objects private while a public bucket URL exists.

A GET of `/companies/:companyId` now requires the signed-in owner. `GET /companies` returns only companies created by that account. Logo metadata includes `url`; document metadata never contains its R2 `key`.

## Private document endpoints

- `GET /companies/:id/documents/:documentId/preview-url` generates an **inline** signed GET URL.
- `GET /companies/:id/documents/:documentId/download-url` generates an **attachment** signed GET URL.
- Both require valid JWT and ownership and return `{url, expiresIn:300}`.
- Do not log or store signed URLs in persistent data. A signed URL is a bearer capability during its validity.

## JWT and user access

Existing access tokens may no longer verify because the token claims/issuer/audience have been corrected. Log in again.

- `POST /users`, `GET /users`, and `PATCH /users/:id/restore`: **ADMIN** only.
- `GET/PATCH/DELETE /users/:id`: self or **ADMIN**.
- `GET /companies/:id`, `PATCH /companies/:id`, `DELETE /companies/:id`, file upload and private document links: company creator only.
- Ordinary `USER` accounts cannot create new users through the administrative endpoint. Until the future `/auth/register` implementation, seed/bootstrap an ADMIN account through a controlled database operation in development (not a public role-selection API).

The user role is read from MongoDB on user management routes, not trusted only from the JWT. Access tokens remain short-lived bearer tokens; immediate global revocation and refresh token rotation are **not implemented** yet.

## Other safeguards

- `/uploads/single` and `/uploads/multiple` are disabled in production; they are unassociated demo uploads.
- `/storage-test` is available only when `NODE_ENV=development`.
- Browser cookies and CORS are not a substitute for CSRF protection. Add CSRF and rate limiting when implementing cookie-based authentication.
- Run `npm ci`, `npm run build` and `npm test -- --runInBand` after checking out the branch.
