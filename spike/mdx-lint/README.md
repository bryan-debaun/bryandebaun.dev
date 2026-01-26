Spike: MDX-aware remark linting

Objective
- Verify `remark` plugin ordering and compatibility for MDX frontmatter + MDX content.

Plan
1. Add `remark-mdx-frontmatter` and `remark-mdx` as dev deps in the spike branch.
2. Update `.remarkrc.json` to include the plugins in the right order. Run `remark` against existing `.mdx` files.
3. Document findings and recommended configuration in `docs/adr/0002-mdx-aware-content-linting.md`.

Success criteria
- `remark` parses and lints existing `.mdx` files without errors.
- No new parser errors in CI when the spike changes are merged to a PR.

Notes
- If `remark` approach fails, evaluate `eslint-plugin-mdx` as alternative.
