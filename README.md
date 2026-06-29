# bryandebaun.dev

Personal website for **Bryan DeBaun** — built with Next.js, TypeScript, and Tailwind CSS.

## Local development

```bash
pnpm install
pnpm run dev
```

This repo uses **pnpm** (pinned via the `packageManager` field). If you don't have it, enable it with `corepack enable pnpm`.

Open [http://localhost:3000](http://localhost:3000).

Note: the `build` script enforces `NODE_ENV=production` to ensure consistent production builds even when a system-level `NODE_ENV` differs. Use `pnpm run dev` for development runs.

## Troubleshooting

### Missing devDependencies when NODE_ENV is set to `production`

If you have `NODE_ENV=production` set at the system or user level, `pnpm` may skip installing `devDependencies` which are required for local builds (for example `tsx` and the OpenAPI generator). If `pnpm run build` prints an error about missing packages, fix it by running:

```bash
pnpm install --prod=false
```

Or install the missing packages directly:

```bash
pnpm add -D tsx swagger-typescript-api
```

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
- Run locally: `pnpm run content:checks` (runs linters, spell-check, and link checks)
- Configs: `.remarkrc.json`, `cspell.json`, `.markdown-link-check.json`
- CI workflow: `.github/workflows/content-checks.yml` runs checks on pull requests and pushes to `main`

If a new word is flagged by `cspell`, add it to `cspell.json` under `words`.

### Markdown doc linting

Plain Markdown docs (`README.md`, `docs/**/*.md`) are linted by the `remark` CLI via `pnpm run lint:content`, configured in `.remarkrc.json`. This config intentionally contains **only** plain-Markdown plugins (`remark-frontmatter` + the lint preset) — do **not** add `remark-mdx` here, or remark will try to parse plain Markdown as MDX and fail on characters like `/`.

> Requires `remark-frontmatter` v5+ (it depends on `mdast-util-frontmatter` v2, compatible with the `unified@11`/`mdast` v2 stack). Pinning the older v4 reintroduces the `Cannot set properties of undefined (setting 'value')` parser crash — see Issue #22.

## Accessibility & visual regression 🧭✅

The repository includes a small Playwright-based audit script used in CI to capture accessibility reports and full-page screenshots for visual review.

- Run locally: `pnpm run a11y:local -- --url http://localhost:3000 --outDir artifacts/a11y` (the script will capture `/`, `/about`, and `/philosophy` by default)
- CI: `pnpm run a11y:ci` is wired into the `a11y-visual.yml` workflow and uploads artifacts for per-PR review
- The script writes screenshots, `axe` results, touch-target reports, and optional Lighthouse HTML per viewport and theme. Use these artifacts for visual diffing or to triage accessibility issues.

## Philosophy articles (DB-backed) 📄

Philosophy notes are no longer file-based MDX. They are stored in the database behind the **MCP server's Articles API** and rendered at request time with ISR (see ADR `docs/adr/0005-db-backed-articles.md`). The frontend:

- Fetches via `src/lib/services/articles.ts` (`listPublishedArticles()` / `getArticleBySlug()`), which call the generated client through `createApi()`. Public reads request **published** articles only.
- Renders the Markdown `body` with `react-markdown` + `remark-gfm` + **`rehype-sanitize`** in `src/components/ArticleBody.tsx`. DB content is sanitized — there is no `dangerouslySetInnerHTML` or `new Function` on article bodies. The renderer strips a single leading `# H1` so the page's canonical title is not duplicated.
- Lists/details (`/philosophy`, `/philosophy/[slug]`), the sitemap, and `rss.xml` all source from the same API. Drafts live DB-side, so there is no client-side `private` filtering.

### Publishing without a redeploy

The philosophy routes use ISR (`export const revalidate = 300`). For instant updates, `POST /api/revalidate` revalidates `/philosophy` (and `/philosophy/<slug>` when a `slug` is in the JSON body). It is secret-protected:

- Set `REVALIDATE_SECRET` in the environment. If it is unset, the endpoint returns **503** (disabled).
- Callers present the secret via the `x-revalidate-secret` header or a `?secret=` query param; otherwise **401**.

## Contributing — editing content ✍️

1. **Page copy** (home, about, projects): edit the corresponding `src/app/**/page.tsx` on a branch off `main`.
2. **Philosophy articles:** authored/published through the Articles API (admin editor — see issue #88), not via repo files.
3. **Résumé:** edit `src/data/resume.json` only, then regenerate the PDF with `pnpm resume:pdf` (a dev/prod server must be running).
4. **Lint before pushing:** `pnpm run lint` (ESLint) and `pnpm run content:checks` (remark + cspell + link-check for Markdown docs).
5. **Open a PR.** CI runs build, lint, content checks, tests, and the a11y/visual suite. If `cspell` flags an intentional word, add it to `cspell.json`.

## Notes

- CI runs on push and PRs and performs build, lint, content checks, tests, and the a11y/visual suite.

### PWA icons / Troubleshooting ⚠️

- If you see an outdated or incorrect icon after installing the PWA (for example, an old `omega` icon), Chrome may be caching the manifest or icon files. Try the following to refresh the installed app:
  - Open Chrome > More tools > Clear browsing data and clear "Cached images and files" for the site, or use an Incognito/fresh profile to test installation.
  - On the site, open DevTools > Application > Manifest and confirm the icons listed match `/public/icons` (look for `wolf-` or `badge-` assets).
  - Re-install the PWA (Chrome > Install app) after clearing site data.

- Developers: the icon generator defaults to `public/icons/wolf.svg`. Run `pnpm run icons:generate` to regenerate PNG assets into `public/icons/`.
- CI will run `pnpm run verify:no-omega` (added) to prevent accidental re-introduction of legacy `omega` references.

## GitHub API access

For some pages (like the Projects listing) this site can fetch repository metadata from the GitHub API. To increase API rate limits and avoid unauthenticated throttling in CI or development, you can optionally set a `GITHUB_TOKEN` in your environment (e.g., `.env.local`). The helper used by the site honors `GITHUB_TOKEN` when present and will fetch with ISR-style caching (24h by default).

Example `.env.local` (do NOT commit):

```
GITHUB_TOKEN=ghp_your_personal_access_token_here
```

In CI, prefer using the built-in `secrets.GITHUB_TOKEN` or a minimal-scope PAT stored in your provider secrets (Vercel/GitHub Actions).
