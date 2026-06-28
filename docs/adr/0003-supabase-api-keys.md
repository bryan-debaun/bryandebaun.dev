# ADR 0003 — Supabase API keys & admin auth model

Date: 2026-06-28

Status: Accepted

## Context

The site uses Supabase for authentication and now (issue #51) for privileged
admin user/invite management. This requires two classes of Supabase API key:

1. A **client-side** key embedded in the browser bundle for public auth flows
   (login, register, password reset).
2. A **server-side privileged** key for `auth.admin.*` operations (listing
   users, generating invite links, deleting pending invites) that bypass Row
   Level Security.

Historically Supabase issued two JWT-based keys for these roles: the `anon` key
and the `service_role` key. Both are derived from the project's JWT secret,
which makes them **hard to rotate** (rotating the JWT secret invalidates every
key and all issued user sessions at once) and means the high-privilege
`service_role` key is a single long-lived secret.

In 2025 Supabase introduced a **modern API key system** and now recommends
migrating off the JWT-based keys:

- **Publishable key** (`sb_publishable_*`) — replaces the `anon` key. Safe for
  the browser/client.
- **Secret key** (`sb_secret_*`) — replaces the `service_role` key. Server-only,
  full access. Multiple named secret keys can be created and **rotated/revoked
  independently** without touching the JWT secret or user sessions.

Per Supabase's docs, the legacy `anon`/`service_role` keys keep working **until
the end of 2026**, but switching is "strongly encouraged."

## Decision

- **Client key:** use the modern **publishable key** via
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_*`). Already adopted.
- **Server key:** use the modern **secret key** via `SUPABASE_SECRET_KEY`
  (`sb_secret_*`) for the server-only admin client
  (`src/lib/supabase/admin.ts`). The legacy `SUPABASE_SERVICE_ROLE_KEY` is read
  only as a transitional fallback and should be removed once the secret key is
  set in all environments.
- **Authorization role source:** admin authorization is determined by
  `app_metadata.role === 'admin'` (admin-controlled), **never**
  `user_metadata.role` (user-editable → privilege escalation). Enforced by
  `requireAdmin()` (API) and `requireAdminPage()` (page redirect) in
  `src/lib/auth-guard.ts`, matching the MCP server's `roleFromToken`.
- **Secret isolation:** the secret-key client is `import 'server-only'` with a
  `typeof window` runtime backstop, env-gated (missing key → HTTP 503, never a
  crash), and never logged or returned to the client.

## Consequences

- Pros:
  - Secret keys are independently rotatable/revocable without invalidating user
    sessions — materially better operational security than the `service_role`
    JWT.
  - Aligns with Supabase's recommended direction ahead of the end-of-2026
    legacy deprecation.
  - One consistent, documented authorization source (`app_metadata.role`).
- Cons:
  - A new server secret (`SUPABASE_SECRET_KEY`) must be provisioned in each
    environment (Vercel). Until then the legacy fallback applies.
  - Secret keys are not JWTs, so any tooling that assumed a decodable JWT
    `service_role` token must be updated (none in this repo).

## Rollout / Rollback

- Set `SUPABASE_SECRET_KEY` (from Supabase dashboard → Project Settings → API
  Keys → Secret keys) in Vercel + local `.env.local`. Admin-user features
  activate once present.
- Rollback: the code falls back to `SUPABASE_SERVICE_ROLE_KEY` if the secret key
  is unset, so reverting is a config change, not a code change.
- Once verified, delete `SUPABASE_SERVICE_ROLE_KEY` from all environments and
  drop the fallback branch in `getAdminSupabase()`.

## Related

- Issue #52 (ADR: Auth & API Client decisions) — this ADR covers the auth-key
  half. The MCP API client (generated `@bryandebaun/mcp-client`, two-factor
  gateway-key + Supabase-JWT auth in `src/lib/mcp.ts`) is the API-client half.
- Issue #51 (admin users & invites) — first consumer of the secret key.

Author: Bryan DeBaun
