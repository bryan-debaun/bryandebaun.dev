# bryandebaun.dev

Personal website for **Bryan DeBaun** — built with Next.js, TypeScript, and Tailwind CSS.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Fonts & Typography

This site uses **Inter** for body/UI text and **Orbitron** for display/headings. Fonts are loaded via Next.js' `next/font` helper in `src/app/layout.tsx` and the typographic tokens (font-family and type scale) are defined in `src/styles/tokens.css` and applied in `src/app/globals.css`.

To update fonts:

- Prefer `next/font` usage in `src/app/layout.tsx` (`Inter` / `Orbitron`) for automatic subsetting and preload.
- If self-hosting is required, add WOFF2 subsets to `public/fonts/` and update `layout.tsx` and the ADR in `docs/adr/0001-choose-fonts.md`.
- Update `src/styles/tokens.css` to adjust the type scale or fallbacks.

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

### PWA icons / Troubleshooting ⚠️

- If you see an outdated or incorrect icon after installing the PWA (for example, an old `omega` icon), Chrome may be caching the manifest or icon files. Try the following to refresh the installed app:
  - Open Chrome > More tools > Clear browsing data and clear "Cached images and files" for the site, or use an Incognito/fresh profile to test installation.
  - On the site, open DevTools > Application > Manifest and confirm the icons listed match `/public/icons` (look for `wolf-` or `badge-` assets).
  - Re-install the PWA (Chrome > Install app) after clearing site data.

- Developers: the icon generator defaults to `public/icons/wolf.svg`. Run `npm run icons:generate` to regenerate PNG assets into `public/icons/`.
- CI will run `npm run verify:no-omega` (added) to prevent accidental re-introduction of legacy `omega` references.

## GitHub API access

For some pages (like the Projects listing) this site can fetch repository metadata from the GitHub API. To increase API rate limits and avoid unauthenticated throttling in CI or development, you can optionally set a `GITHUB_TOKEN` in your environment (e.g., `.env.local`). The helper used by the site honors `GITHUB_TOKEN` when present and will fetch with ISR-style caching (24h by default).

Example `.env.local` (do NOT commit):

```
GITHUB_TOKEN=ghp_your_personal_access_token_here
```

In CI, prefer using the built-in `secrets.GITHUB_TOKEN` or a minimal-scope PAT stored in your provider secrets (Vercel/GitHub Actions).
