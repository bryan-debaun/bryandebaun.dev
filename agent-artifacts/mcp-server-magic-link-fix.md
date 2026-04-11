# Magic Link Authentication Broken: AuthMagicLink Table Missing

## Problem Statement

Magic link authentication fails with database error, preventing passwordless login. Users cannot authenticate via magic link, which is the primary authentication method.

## Root Cause Identified ✅

Migration `20260219163147_simplify_single_user` dropped the `AuthMagicLink` table:

```sql
DROP TABLE IF EXISTS "AuthMagicLink" CASCADE;
```

However, the code in `src/auth/magic-link.ts` still attempts to create magic link records:

```typescript
await prisma.authMagicLink.create({
    data: { jti, email, userId: userId ?? null, expiresAt }
})
```

**Result**: `Cannot read properties of undefined (reading 'create')`

## Evidence

### Server Logs

```
incoming request: POST /api/auth/magic-link authPresent=false
magic link send failed Cannot read properties of undefined (reading 'create')
```

### Client Behavior

- Magic link request returns 202 Accepted (intentional, prevents email enumeration)
- No email is sent
- User cannot authenticate

### Code References

- **Table dropped**: `prisma/migrations/20260219163147_simplify_single_user/migration.sql:47`
- **Code using table**: `src/auth/magic-link.ts:61`
- **Original migration**: `prisma/migrations/20260202160000_add_auth_magic_links/migration.sql`

## Impact

**Critical - Complete Authentication Failure**

- ❌ Magic link authentication non-functional
- ❌ Users cannot log in via passwordless method
- ❌ Password login also affected (returns 401, separate investigation needed)
- ❌ Blocks all user access to authenticated features

## Solution

### Add AuthMagicLink Model Back to Schema

Add to `prisma/schema.prisma`:

```prisma
// Magic link tokens for passwordless authentication
model AuthMagicLink {
  id         Int       @id @default(autoincrement())
  jti        String    @unique // JWT token ID for single-use enforcement
  email      String
  userId     Int?      // Optional: link to Profile if needed (nullable for flexibility)
  expiresAt  DateTime
  consumed   Boolean   @default(false)
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  @@index([email])
  @@index([expiresAt])
  @@index([jti])
}
```

**Note**: Original migration used `INTEGER REFERENCES "User"(id)` but User table no longer exists. Using `Int?` (nullable) allows magic links to work without foreign key constraint. For single-user system, userId can remain null or be omitted.

### Create Migration

Run in MCP server directory:

```bash
npx prisma migrate dev --name restore_auth_magic_link
```

This will generate migration SQL:

```sql
-- Restore AuthMagicLink table for passwordless authentication
CREATE TABLE "AuthMagicLink" (
  id SERIAL PRIMARY KEY,
  jti TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  "userId" INTEGER,
  "expiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  "consumedAt" TIMESTAMP WITHOUT TIME ZONE,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX "AuthMagicLink_email_idx" ON "AuthMagicLink" (email);
CREATE INDEX "AuthMagicLink_expiresAt_idx" ON "AuthMagicLink" ("expiresAt");
CREATE INDEX "AuthMagicLink_jti_idx" ON "AuthMagicLink" (jti);
```

### Deploy to Render

After creating migration locally:

1. Commit schema and migration files
2. Push to repository
3. Render will auto-deploy and run migrations
4. Test magic link authentication

### Verify Fix

```bash
# Test magic link endpoint directly
curl -X POST https://bad-mcp.onrender.com/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check Render logs - should see:
# magic_link.sent { email: 'test@example.com' }
# NOT: magic link send failed
```

## Alternative: Remove Magic Link Code

If magic links are not needed for single-user system:

1. Remove `MagicLinkController` registration
2. Remove magic link routes from OpenAPI spec
3. Remove client-side magic link UI
4. Keep password authentication only

**Not recommended** - magic links are more secure and convenient for single-user systems.

## Acceptance Criteria

- [ ] AuthMagicLink model added to Prisma schema
- [ ] Migration created and applied locally
- [ ] Changes committed and pushed
- [ ] Render deployment runs migration successfully
- [ ] Magic link endpoint works without database errors
- [ ] Magic link emails are sent (assuming SendGrid configured)
- [ ] User can authenticate via magic link end-to-end
- [ ] Server logs show `magic_link.sent` not `magic link send failed`

## Context

- **MCP Server**: `https://bad-mcp.onrender.com`
- **Migration that broke it**: `20260219163147_simplify_single_user`
- **Original migration**: `20260202160000_add_auth_magic_links`
- **Discovery date**: 2026-04-11
- **Reporter**: Architect agent investigating authentication issues
- **Related client issue**: bryan-debaun/bryandebaun.dev#66

## Priority

**Critical** - Blocks all authentication, immediate fix required.
