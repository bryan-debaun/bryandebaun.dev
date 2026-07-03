# Secrets management with Doppler

This repo's environment variables are managed in **[Doppler](https://www.doppler.com/)**
— a cloud secrets store — instead of hand-copying `.env.local` between machines.

- **Values, not files.** Doppler stores each variable as a discrete key/value; each
  machine reconstructs the environment via the CLI. No `.env` is copied.
- **Two configs:** `dev` (local) and `prd` (production on Vercel).
- **`NEXT_PUBLIC_*`** are build-time public values baked into the client bundle — Doppler
  injects them at build just like server-only vars.
- `doppler.yaml` pins project `bryandebaun-dev` / config `dev` so every machine
  auto-configures. `.env.example` documents every variable (placeholders only).

## One-time: create the project (owner, once)

Create Doppler project **`bryandebaun-dev`** (configs `dev`, `prd`), then bootstrap `dev`:

```powershell
doppler login                            # browser auth
doppler projects create bryandebaun-dev  # or create it in the dashboard
doppler setup                            # reads doppler.yaml → bryandebaun-dev / dev
doppler secrets upload .env.local      # push local values into the dev config (one time)
```

Populate `prd` with production values in the dashboard (or `doppler secrets set
--config prd`). See `.env.example` for the full variable list.

## Per machine (PC, Mac, …)

```powershell
doppler login
doppler setup            # auto-selects bryandebaun-dev / dev from doppler.yaml
doppler run -- pnpm dev  # injects secrets into the process
```

## Daily use — prefix commands with `doppler run --`

Package scripts are unchanged; run them through Doppler for managed secrets:

```powershell
doppler run -- pnpm dev            # next dev --turbopack
doppler run -- pnpm run build      # build:packages → tsx scripts/build.ts
doppler run -- pnpm start          # next start
```

## Production (Vercel)

Vercel injects env vars per environment (Production / Preview / Development) from the
dashboard today. To make Doppler the source of truth, connect Doppler's **native Vercel
integration** and map the `prd` config → Vercel **Production** (and, later, a config →
**Preview**). `NEXT_PUBLIC_*` values are read at build time on Vercel as usual.

## Rotate after migrating

Migration is the moment to rotate the sensitive secrets that have lived in `.env.local`:
`MCP_API_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `REVALIDATE_SECRET`,
`GITHUB_TOKEN`, `GITHUB_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET`, and the
`VERCEL_MCP_TOKEN`.
