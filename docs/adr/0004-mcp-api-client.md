# ADR 0004 — MCP API client (generation, auth, CI validation)

Date: 2026-06-28

Status: Accepted

## Context

The site's dynamic data (Books, Authors, Ratings, and now Articles) lives in the
**MCP server** (`bad-mcp.onrender.com`) and its own Postgres — not in Supabase
(which the site uses only for auth; see ADR 0003). The website must call the MCP
server's HTTP API for both public reads and admin writes.

We need decisions on three things:

1. **How the client is produced** — hand-written vs. generated from the API
   contract.
2. **How requests authenticate** — the MCP server runs two auth layers (a
   gateway API key, and a per-user Supabase JWT for `@Security('jwt', ['admin'])`
   routes).
3. **How we keep the client honest** — preventing drift between the committed
   client and the live API contract.

## Decision

- **Generate the client** from the MCP server's OpenAPI/Swagger spec using
  `swagger-typescript-api`, into the local workspace package
  `@bryandebaun/mcp-client` (`packages/mcp-client`). Regenerate with
  `pnpm run generate:mcp-client` (`scripts/generate-mcp-client.ts`, which fetches
  the spec using `MCP_API_KEY`). The generated client is committed.
- **Wrap the generated client** in `src/lib/mcp.ts` (`createApi(userToken?)`),
  which is the single place auth headers are assembled. Two-factor scheme:
  - **Reads / server-to-server:** `Authorization: Bearer <MCP_API_KEY>`.
  - **Admin writes (Supabase user):** `Authorization: Bearer <Supabase JWT>`
    (satisfies the server's `jwtMiddleware` + `@Security('jwt',['admin'])`) **and**
    `X-MCP-Api-Key: <MCP_API_KEY>` (satisfies the gateway `mcpAuthMiddleware`).
    The gateway key moves to the `X-MCP-Api-Key` header precisely so it doesn't
    contend with the JWT for the `Authorization` slot. This matches the server's
    `src/http/middleware/mcp-auth.ts`.
  - Admin role itself is `app_metadata.role` (see ADR 0003), enforced by
    `requireAdmin()` before any privileged MCP call.
- **Validate in CI**: the `verify-mcp-client` workflow regenerates the client
  from the live spec and fails on any diff in `packages/mcp-client/src`, so the
  committed client can never silently drift from the contract. When the server
  adds endpoints (e.g. the Article CRUD endpoints added in 2026-06), the gate
  fails until the client is regenerated and committed.

## Consequences

- Pros:
  - The client always reflects the real API contract; types are free and accurate.
  - One audited choke point (`src/lib/mcp.ts`) for auth header assembly — no
    ad-hoc credential handling scattered across call sites.
  - CI catches contract drift automatically (issues #53/#54).
- Cons:
  - Regeneration depends on reaching the live spec with `MCP_API_KEY`; the CI job
    can fail environmentally if the spec endpoint/secret is unavailable (it is a
    non-required check for this reason — only `build` blocks merges).
  - A generated client occasionally needs a manual regen + commit when the server
    evolves (a deliberate, reviewable step rather than silent updates).

## Rollout / Rollback

- Regenerate after any MCP server API change: `pnpm run generate:mcp-client`
  (needs `MCP_API_KEY` in `.env.local`), then `pnpm run build:packages`, commit.
- Rollback is a `git revert` of the regenerated client; the wrapper in
  `src/lib/mcp.ts` is stable across regenerations.

## Related

- ADR 0003 (Supabase API keys & admin auth model) — together these two ADRs
  satisfy issue **#52** ("ADR: Auth & API Client decisions"): 0003 is the auth
  half, 0004 is the API-client half.
- Issues #53/#54 — MCP client generation + CI validation (already shipped).

Author: Bryan DeBaun
