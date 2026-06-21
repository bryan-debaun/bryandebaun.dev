# Integration / E2E suite

End-to-end specs that exercise real request flows through the Next.js app:
admin auth (`requireAdmin`) and Books CRUD via the `/api/admin/*` routes, which
proxy writes to the **live production MCP server**. Added for
[issue #84](https://github.com/bryan-debaun/bryandebaun.dev/issues/84).

This is **separate** from the visual/a11y Playwright suite (`tests/visual/`,
`playwright.config.ts`). Each suite has its own config and file-naming
convention so they never pick up each other's files:

| Suite       | Config                              | testDir            | match               |
| ----------- | ----------------------------------- | ------------------ | ------------------- |
| Visual/a11y | `playwright.config.ts`              | `tests/visual`     | `**/*.playwright.ts`|
| Integration | `playwright.integration.config.ts`  | `tests/integration`| `**/*.spec.ts`      |

Vitest (`pnpm test`) excludes both directories.

## Running

```bash
# 1. Build once, so the webServer can `pnpm start` a production server.
pnpm build

# 2. Run the suite. If nothing is listening on the baseURL, the config starts
#    `pnpm start` for you (reuseExistingServer: true reuses a dev server if you
#    already have one running).
pnpm test:integration
```

Credentials are read from the gitignored `.env.local` (loaded by the config via
Node 24's `process.loadEnvFile`). Required keys:

- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` — `app_metadata.role=admin` (passes `requireAdmin`)
- `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` — confirmed non-admin (for 403 tests)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `MCP_BASE_URL`, `MCP_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (optional; defaults to `http://localhost:3000`)

If required keys are missing the specs **skip** rather than fail — so forks and
contributors without secrets aren't blocked.

## Specs

- **`auth-negative.spec.ts`** — the priority suite. Anonymous → 401 and
  non-admin → 403 on the guarded admin routes. No backend writes; must always
  pass. (Note: `/api/admin/books` has only `POST`, so these assert against the
  routes that actually run `requireAdmin`, not a non-existent admin `GET`.)
- **`admin-books.crud.spec.ts`** — admin create → read (get + list) → update →
  delete → assert-gone, against the live MCP. Namespaced + torn down.
- **`mcp-auth-probe.spec.ts`** — diagnostic: hits the MCP server's
  `POST /api/books` directly with three auth shapes and logs whether the server
  trusts the Supabase admin JWT for writes (the #84 server-side blocker). Folds
  in the retired `agent-artifacts/probe-mcp-admin-auth.ts`.

## Safety model — why this can write to prod

Writes go to the **real** MCP server (no staging backend exists). Three layers
keep production clean:

1. **Run-unique namespacing.** Every record this suite creates is titled
   `[e2e-<runId>]` where `runId` is a per-run timestamp + random suffix. Test
   data is always visually distinguishable and attributable to a run.
2. **Guaranteed teardown.** A `TestData` tracker registers every created id and
   `cleanup()` deletes them in `afterAll` — even when a test fails. The CRUD
   spec also untracks records it deletes itself so cleanup never double-deletes.
3. **Pre-run sweeper.** `sweepLeftovers()` runs before the CRUD spec and reaps
   any `[e2e-` books left behind by a crashed prior run.

### Books-only by design

The website exposes admin **create/update/delete for books**, but only
**create** for authors (`POST /api/admin/authors`; there is no admin author
update/delete route). Because authors can't be deleted through the site, the
suite **never creates authors** — every record it makes must be tearable-down so
we never orphan data. There is therefore no `admin-authors.crud.spec.ts`. If an
admin author delete route is added later, mirror `admin-books.crud.spec.ts`.

## CI

`.github/workflows/integration.yml` runs on `workflow_dispatch` and PRs. A
preflight step checks for the required secrets and **skips the whole job** when
they're absent (forks), so it never fails for lack of credentials. When secrets
are present it builds, starts the server, and runs `pnpm test:integration`,
uploading the Playwright report/traces as an artifact.
