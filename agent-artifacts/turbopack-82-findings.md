# Turbopack spike findings (#82)

**Branch:** `spike/82-turbopack` (prototype changes left uncommitted)
**Date:** 2026-06-08 · **Next.js:** 16.1.4 · **Node:** 24.16.0 · **pnpm:** 10.34.1 · **OS:** Windows 11
**Method:** cold runs (`.next/cache` cleared before each), startup measured to the `✓ Ready in …` line; build measured wall-clock around `next build`.

---

## TL;DR

**Recommendation: Dev is already done (no action needed); ADOPT Turbopack for `build` too — low risk.**

The headline finding: **Next 16 already runs `next dev` on Turbopack by default.** The dev script (`next dev`) boots with `▲ Next.js 16.1.4 (Turbopack)` with no flag — so the dev-mode "win" in this issue is already in effect today. The remaining decision is the **production build path**, and `next build --turbopack` works cleanly with this repo's Contentlayer2 + `scripts/build.ts` pipeline.

---

## Evidence

### 1. `next dev` is on Turbopack by default in Next 16

- Running the existing `pnpm run dev` (i.e. `next dev`, **no flag**) logs `▲ Next.js 16.1.4 (Turbopack)`. There is now an explicit **`--webpack`** opt-out flag in `next dev --help`, confirming Turbopack is the default bundler for dev.
- Implication: **the `--turbopack` flag is redundant for dev** in this repo. Adding it changes nothing functionally; it only documents intent. The `package.json` `dev` script can be left as-is.

### 2. Startup speed delta (cold, cache cleared)

| Bundler | Command | Ready in |
|---|---|---|
| Turbopack (default + explicit `--turbopack`) | `next dev` / `next dev --turbopack` | **~1.2s** (1165ms explicit run) |
| Webpack (legacy, explicit) | `next dev --webpack` | **~2.1s** |

~1.8x faster cold startup on Turbopack. Both boot **cleanly** — `.env.local` detected, no plugin/loader warnings, no errors. (Headless HMR latency wasn't micro-benchmarked; Turbopack's incremental model is its larger real-world win, but startup alone already favors it and is what the existing default already delivers.)

### 3. `next build --turbopack` is compatible with the Contentlayer2 pipeline

- `pnpm exec next build --turbopack` → **exit 0**, `✓ Compiled successfully in ~2.0s`, total wall-clock ~15s.
- The emitted **route table is identical** to the webpack baseline — including the SSG `/philosophy/[slug]` routes (`/philosophy/cptsd`, `/philosophy/private-example`) that are generated **from Contentlayer content**. This proves Turbopack correctly resolves the `contentlayer/generated` tsconfig path alias and bundles the MDX-derived content.
- **No Turbopack-specific warnings** about loaders, plugins, or unsupported config.

### Why compatibility is low-risk here

- **Contentlayer2 is not a Next bundler plugin.** `scripts/run-content.ts` shells out to `contentlayer2 build` as a **separate process** that writes `.contentlayer/generated`, *before* `next build` ever runs. The Next build only **imports** the generated output via the `contentlayer/generated` path alias. So Turbopack never has to run a Contentlayer webpack loader — there isn't one. Content generation is bundler-agnostic.
- **`next.config.ts` has zero custom `webpack` config.** Turbopack's main migration risk is translating bespoke `webpack()` customizations; this repo has none, so there is nothing to break.

---

## Dev vs build verdict

| Path | Verdict | Notes |
|---|---|---|
| **Dev** | ✅ Already on Turbopack (default) | No change required. Optionally add `--turbopack` to the `dev` script purely for explicitness. |
| **Build** | ✅ Compatible, safe to adopt | `next build --turbopack` succeeds with identical routes incl. Contentlayer SSG pages. |

## Compatibility risks / caveats

- **None blocking.** The benign logs seen in the Turbopack build (`DYNAMIC_SERVER_USAGE` for `/ratings` and `/authors`, `url.parse()` `DEP0169`) are **also present in the webpack baseline** — they are runtime/data-plane behaviors, not bundler issues.
- Build mode in Next 16 is **stabilizing** (vs dev which is stable). It works here today; revisit on Next minor bumps. Keep the webpack build path available as a fallback via `next build --webpack` if a future regression appears.
- Turbopack's `--experimental-analyze` is **only** available with Turbopack — a minor bonus if bundle analysis is ever wanted.

---

## Recommendation (detailed)

1. **Dev: no action.** It's already Turbopack. (Optional cosmetic: set `"dev": "next dev --turbopack"` to make intent explicit and survive any future default change.)
2. **Build: adopt Turbopack.** Change the `next build` invocation inside `scripts/build.ts` (line ~27) from:
   ```ts
   code = await spawnCmd('pnpm', ['exec', 'next', 'build']);
   ```
   to:
   ```ts
   code = await spawnCmd('pnpm', ['exec', 'next', 'build', '--turbopack']);
   ```
   The surrounding pipeline (`check-dev-deps` → `run-content` → `next build`) is unchanged; only the final bundler flag flips.
3. **Verify in CI before merging:** run the full `pnpm run build` (wrapper, not bare `next build`) and the Playwright/visual + a11y jobs on a PR, since those exercise the built output. Local evidence is strong, but the dynamic Supabase/MCP routes are best validated in the CI build env.

**Verdict: dev-mode is already realized; recommend full build adoption** (low risk), gated on a green CI build + visual/a11y pass on the PR.
