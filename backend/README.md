# Backend — NestJS API

REST API for the boilerplate. NestJS 11, TypeORM (MySQL), JWT auth with
rotating refresh tokens.

## Running

```bash
npm install                     # this directory is a standalone npm project
cp .env.example .env
npm run jwtsecret -- --write    # generates JWT_SECRET into .env
npm run migration:run
npm run seed
npm run start:dev
```

`http://localhost:3003/api` · Swagger at `/api/docs` (development only).

## Structure

```
src/
├── common/
│   ├── config/         env.validation.ts (boot-time schema), cookie options
│   ├── constants/      roles.config.ts — roles and their permissions
│   ├── decorators/     @Public, @Roles, @RequirePermissions, @CurrentUser
│   ├── dto/            request/response shapes
│   ├── filters/        global exception filter
│   ├── guards/         RolesGuard
│   ├── helpers/        password hashing
│   ├── interceptors/   response envelope
│   └── middlewares/    request logging
├── database/
│   ├── data-source.ts  shared by the app and the migration CLI
│   ├── entities/       User, RefreshToken, AuditLog, SystemSettings
│   ├── migrations/
│   └── seeds/
└── modules/            auth, users, profile, settings, audit-log,
                        upload, mail, dashboard, health
```

## Global pipeline

Registered in `app.module.ts`, in this order — the ordering is load-bearing:

```
Guards:       ThrottlerGuard → JwtAuthGuard → RolesGuard
Pipe:         ValidationPipe (whitelist, forbidNonWhitelisted, transform)
Interceptors: TransformInterceptor → ClassSerializerInterceptor
Filter:       GlobalExceptionFilter
```

`TransformInterceptor` must be registered **before** `ClassSerializerInterceptor`.
The first-registered interceptor is outermost, so its `map()` runs last; reverse
them and the serializer receives the plain `{success, data}` envelope, which
carries no `@Exclude()` metadata, and `password` leaks on every endpoint that
returns a `User`.

## Environment

Validated at boot by `common/config/env.validation.ts` — a missing or
placeholder value fails startup rather than surfacing as a runtime mystery.

| Variable                                                | Required | Notes                                                            |
| ------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `JWT_SECRET`                                            | yes      | ≥ 32 chars; the example placeholder is rejected                  |
| `DATABASE_HOST` / `_PORT` / `_USER` / `_PASS` / `_NAME` | yes      | prefer `127.0.0.1` over `localhost` — see Deploying              |
| `DATABASE_RETRY_ATTEMPTS`                               | no       | default `3`                                                      |
| `ALLOWED_ORIGINS`                                       | yes      | comma-separated; `*` is rejected (incompatible with credentials) |
| `APP_URL`                                               | yes      | frontend origin, used to build reset links                       |
| `JWT_ACCESS_EXPIRES_IN`                                 | no       | default `15m`                                                    |
| `JWT_REFRESH_EXPIRES_IN`                                | no       | default `7d`                                                     |
| `JWT_ISSUER` / `JWT_AUDIENCE`                           | no       | pinned during verification                                       |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` / `COOKIE_DOMAIN`   | no       | `false` / `lax` in dev                                           |
| `SMTP_HOST` / `_PORT` / `_USER` / `_PASS` / `_FROM`     | no       | unset ⇒ emails are logged to the console                         |
| `CLOUDINARY_*`                                          | no       | only needed for the Cloudinary upload routes                     |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`              | no       |                                                                  |

`DATABASE_SYNC` no longer exists. Setting it fails the boot on purpose —
schema changes go through migrations.

### Generating a JWT secret

```bash
npm run jwtsecret                       # print a new 64-char secret
npm run jwtsecret -- --write            # write it into .env
npm run jwtsecret -- --write --force    # rotate an existing real secret
```

`--write` backs the file up to `.env.bak` first, and refuses to overwrite a
secret that isn't a known placeholder unless you pass `--force` — rotating the
signing key invalidates every access token in circulation.

## Migrations

```bash
npm run migration:generate -- src/database/migrations/AddSomething
npm run migration:run
npm run migration:revert
npm run migration:show
npm run migration:run:prod    # against dist/, used by the Docker entrypoint
```

If you are adopting this on a database previously managed by `synchronize:true`,
either drop and recreate it, or mark the baseline as applied:

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1755000000000, 'InitSchema1755000000000');
```

## Deploying

```bash
npm install                    # .npmrc forces devDependencies; the build needs them
npm run build
npm run migration:run:prod     # apply the schema before the app boots
npm prune --omit=dev --include=prod   # optional: drop the build toolchain
node dist/main
```

**`Access denied for user 'x'@'::1'`** — the credentials are probably fine.
Node 17+ resolves `localhost` to the IPv6 loopback `::1` first, and MySQL
treats `::1` as a different host from `localhost`, so a grant issued to
`'user'@'localhost'` does not match. Set `DATABASE_HOST=127.0.0.1`.

**"App did not call listen() within N seconds"** on managed hosts — the server
only starts listening after Nest finishes wiring every module, and that
includes connecting to the database. It is almost always a downstream symptom:
fix the connection error above it and listen() happens normally. `main.ts`
calls `bootstrap()` unconditionally and has no `require.main === module` guard,
so that particular platform warning does not apply here.

Migrations do **not** run automatically at boot. Run `migration:run:prod`
yourself, or the app starts against an empty schema and every query fails.

## Testing

```bash
npm test          # unit
npm run test:e2e  # needs a reachable MySQL with migrations applied
```

The e2e suite boots the real `AppModule`, so it exercises the actual guards,
pipes and interceptors. It asserts the security properties directly: no reset
token in the `forgot-password` response, `role` rejected during registration,
403 for a `SUBSCRIBER` on admin routes, and refresh-token reuse revoking the
whole family.

Point it at a **throwaway database** — `test/setup-e2e.ts` truncates `users`,
`refresh_tokens` and `audit_logs` between tests:

```bash
DATABASE_NAME=app_test npm run test:e2e
```

The functional specs run with rate limiting skipped, or the 5-per-minute cap on
the auth routes would reject their own traffic. The switch is
`NODE_ENV=test` **and** `THROTTLE_DISABLED=true` — both, so it cannot be tripped
on a production deployment — and `throttling.e2e-spec.ts` runs with the guard
on and asserts the 429 still fires.

## Notes

- Passwords: bcrypt, cost 12, hashed asynchronously.
- `userCode` is derived from the primary key inside a transaction, so it cannot
  race under concurrent registration.
- Soft deletes use `@DeleteDateColumn` only; TypeORM excludes deleted rows
  automatically.
- SVG uploads are rejected — `/uploads` is served from this origin, so an
  uploaded SVG would be stored XSS.
