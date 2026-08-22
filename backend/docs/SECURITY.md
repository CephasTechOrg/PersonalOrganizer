# Security

## Current security model

This starter is designed for one owner.

Authentication is application-managed rather than delegated to Neon. Neon is used only as PostgreSQL storage.

## Credentials

The application expects:

- `OWNER_EMAIL`
- `OWNER_PASSWORD_HASH`
- `AUTH_SECRET`
- `DATABASE_URL`

Never commit real values to Git.

The password is stored as an scrypt hash. Generate it with:

```bash
npm run auth:hash
```

## Session

Successful login creates a signed JWT stored in a cookie configured as:

- HttpOnly
- Secure in production
- SameSite=Strict
- path `/`
- seven-day expiry

The token is validated on every protected route.

## Login throttling

Five failed attempts inside a fifteen-minute window block the same hashed client/email combination for fifteen minutes.

The database stores an HMAC identifier rather than the raw IP address.

## Mutation protection

Authenticated cookies use SameSite=Strict. Mutation endpoints also reject requests when an explicit `Origin` header does not match the application origin.

Do not enable permissive CORS.

## Database

`DATABASE_URL` is server-only. Never expose it through a `NEXT_PUBLIC_` environment variable or browser bundle.

## Production checklist

- Use a unique 20+ character owner password.
- Use a randomly generated `AUTH_SECRET` of at least 32 bytes.
- Restrict Neon project access.
- Enable MFA on Vercel, Neon, and GitHub accounts.
- Keep dependency lockfiles committed.
- Run dependency/security updates periodically.
- Keep production and preview databases separated if previews contain real data.
