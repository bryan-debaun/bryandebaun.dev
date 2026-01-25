Testing checklist for Contentlayer integration (branch: `feature/contentlayer`, PR: #6)

1) Local build & lint
   - Run: `npm ci && npm run build && npm run lint`
   - Expect: `contentlayer2 build` generates documents in `.contentlayer/generated` and `next build` completes; `eslint` exits 0.

2) Content generation
   - Run: `npm run content:dev` (or `npx contentlayer2 dev`)
   - Expect: generated docs appear under `.contentlayer/generated/Post` and `allPosts` includes `hello-world`.

3) App verification
   - Run: `npm run dev` and visit `/blog`.
   - Expect: page shows "Blog" and lists the sample post title `Hello, Contentlayer` (link currently points to `/blog/<slug>`; dynamic post route not implemented yet).

4) CI validation
   - Confirm: GitHub Actions `CI` passes for the feature branch and draft PR (ESLint now ignores `.contentlayer`).

Known issues

- Contentlayer CLI emits an upstream `TypeError: The "code" argument must be of type number` during `contentlayer2 build` after generating docs; generation still succeeds. Track/patch upstream as follow-up.

How to report failures

- Include failing step, full command output, and the CI workflow run URL.
