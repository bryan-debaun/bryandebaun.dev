# ADR 0005 — DB-backed articles via the MCP server (retire file-based MDX)

Date: 2026-06-28

Status: Accepted

## Context

`philosophy` articles are authored as `.mdx` files in `src/content/`, compiled by
**Contentlayer at build time** into `.contentlayer/generated`, and baked into the
Vercel deploy. A `private: true` frontmatter flag + `src/lib/content.ts`
`publicOnly()` hides flagged items from listings, sitemap, and RSS.

Two problems with this for the content we actually care about (e.g. the CPTSD
"living document"):

1. **Drafts live in public source.** This repo is **public**, so any
   unpublished/private article text is readable on GitHub before it's ready.
2. **Publishing requires a redeploy.** Every edit is a git commit + Vercel build.

A pre-existing gap reinforces the point: `src/app/philosophy/[slug]/page.tsx`
builds `generateStaticParams()` from the **unfiltered** `allPhilosophies` and
never checks `private`, so a `private` note is reachable by URL — the file-based
`private` flag is effectively non-functional for drafts. That same file renders
content by `eval`-ing Contentlayer-compiled MDX via `new Function(code)` — safe
only for trusted build-time input, **unsafe for DB-sourced content**.

The MCP server now ships an **`Article`** resource (mcp-server #120 / PR #124),
already reflected in the generated client (`packages/mcp-client`):

```
Article         { id, slug, title, summary?, body (markdown), status, tags[], publishedAt?, createdAt, updatedAt }
ArticleStatus   draft | published
endpoints       GET /api/articles?status=draft|published|all
                GET /api/articles/{slug}
                POST /api/articles            (admin)
                PUT /api/articles/{slug}      (admin; supports newSlug)
                DELETE /api/articles/{slug}   (admin)
```

## Decision

Adopt **DB-backed articles served via the existing MCP server**, rendered as
**sanitized Markdown**, with `draft | published` status and publish without a
redeploy.

This is the "with the grain" option: the site already calls the MCP server's
Supabase Postgres through the generated Axios client (API-key reads,
Supabase-JWT admin writes — see ADR 0004), exactly as it does for
books/authors/movies/games. Articles become one more resource of the same shape —
no new vendor enters the constellation.

### Key decisions

- **Markdown, not MDX.** Article bodies render as **Markdown → sanitized HTML**,
  never `eval`'d. Use **`react-markdown` + `remark-gfm` + `rehype-sanitize`**
  (renders to React elements, sanitizes by default, no `dangerouslySetInnerHTML`,
  no `new Function`). **Trade-off:** no React components embedded inside articles —
  acceptable; the one migrated article (CPTSD) is prose-only. Preserve the
  existing `prose prose-norwegian` styling.
- **Status field** `draft | published`; **public reads return only `published`**
  (the `?status` param defaults to published for anonymous callers). Drafts live
  only in the DB → never in public source (solves #1).
- **Publish without redeploy** (solves #2): philosophy routes become dynamic with
  **ISR** (`export const revalidate = N`). A **secret-protected
  `POST /api/revalidate`** route calls `revalidatePath` so the MCP server can
  trigger instant updates on publish (the server-side trigger is the optional
  fast-follow in mcp-server #120).
- **Auth for writes** reuses the established path (ADR 0003/0004): `requireAdmin`
  (`app_metadata.role`) + the two-factor MCP auth (Supabase JWT in
  `Authorization` + gateway key in `X-MCP-Api-Key`), all server-side.
- **Migration scope:** only **CPTSD** is preserved (seeded into the DB via #120).
  `hello-world.mdx` (already deleted) and `private-example.mdx` are dropped. The
  `src/content/philosophy` pipeline + Contentlayer usage **for philosophy** is
  retired; if no other consumer remains, Contentlayer can be removed entirely
  (verify `Post`/`allPosts` usage during implementation).

### Alternatives considered

- **Keep files, move drafts to a private repo/dir** — hides text but still
  requires a redeploy to publish. Fails driver #2. Rejected.
- **Third-party headless CMS** (Sanity/Contentful/Notion) — satisfies both
  drivers with less code but adds a vendor the ecosystem doesn't need; runs
  against the "with the grain" principle. Rejected for now.
- **Auth-gated rendering** — unnecessary; published = public is acceptable.
  Out of scope.

## Consequences

- Frontend rewires philosophy to fetch from the API, renders sanitized Markdown,
  adds ISR/revalidation, and removes Contentlayer for philosophy (#87).
- A protected **admin authoring UI** (WYSIWYG/Markdown editor, draft→publish)
  sits on top of the same API (#88), reusing the #51 admin patterns.
- Articles lose MDX component support (accepted).
- Content availability now depends on the MCP server at request time — the same
  dependency the rest of the site already has.
- The unsafe `new Function(code)` render path is removed (security improvement).

## Acceptance criteria

- [x] ADR committed to `docs/adr/` capturing context, decision, key decisions
  (Markdown-not-MDX, status, no-redeploy mechanism), alternatives, consequences.
- [x] ADR links the implementation issues.

## Related

- Backend (Articles API): bryan-debaun/mcp-server #120 (merged, PR #124).
- Frontend rendering + retire Contentlayer: #87.
- Admin authoring UI: #88.
- Builds on ADR 0003 (Supabase keys / admin model) and ADR 0004 (MCP API client).

Author: Bryan DeBaun
