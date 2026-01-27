# bryandebaun.dev

Personal website for **Bryan DeBaun** — built with Next.js, TypeScript, and Tailwind CSS.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

This project is designed for deployment to Vercel. Connect your GitHub repo in Vercel and add the custom domain (`bryandebaun.dev`) after DNS is configured.

## Content checks & CI (Issue #17) 🔧

This repository includes content quality tooling and a CI job to run checks on PRs and pushes to `main`:

- Tools: `remark` (lint), `cspell` (spell-check), `markdown-link-check` (link validation)
- Run locally: `npm run content:checks` (runs linters, spell-check, and link checks)
- Configs: `.remarkrc.json`, `cspell.json`, `.markdown-link-check.json`
- CI workflow: `.github/workflows/content-checks.yml` runs checks on pull requests and pushes to `main`

If a new word is flagged by `cspell`, add it to `cspell.json` under `words`.

## Notes

- MDX/Contentlayer integration is planned, but currently the `next-contentlayer` package is incompatible with Next.js 16; see Issue #2 for tracking.
- CI runs on push and PRs and performs build and lint checks.

## GitHub API access

For some pages (like the Projects listing) this site can fetch repository metadata from the GitHub API. To increase API rate limits and avoid unauthenticated throttling in CI or development, you can optionally set a `GITHUB_TOKEN` in your environment (e.g., `.env.local`). The helper used by the site honors `GITHUB_TOKEN` when present and will fetch with ISR-style caching (24h by default).

Example `.env.local` (do NOT commit):

```
GITHUB_TOKEN=ghp_your_personal_access_token_here
```

In CI, prefer using the built-in `secrets.GITHUB_TOKEN` or a minimal-scope PAT stored in your provider secrets (Vercel/GitHub Actions).
