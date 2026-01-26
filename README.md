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
