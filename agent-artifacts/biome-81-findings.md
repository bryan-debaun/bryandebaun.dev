# Biome hybrid spike findings (#81)

**Branch:** `spike/81-biome` (prototype `biome.json` + dep install left uncommitted)
**Date:** 2026-06-08 · **Biome:** 2.4.16 (latest stable, pinned exact) · **ESLint:** 9 + `eslint-config-next@16.1.4`
**Node:** 24.16.0 · **pnpm:** 10.34.1 · **OS:** Windows 11

---

## TL;DR

**Recommendation: ADOPT the hybrid** — Biome owns base TS/JS format + lint on `src`; ESLint retained for Next-specific + MDX rules. The speed win is large (order of magnitude), the two tools coexist without conflict once Biome's migrated Next/React/a11y rules are turned **off**, and Biome surfaces ~69 net-new, mostly auto-fixable findings. The one real cost is a **one-time ~112-file "format the world" churn commit**, which is benign (mechanical, semantic no-ops).

Gate adoption on: (1) landing the format-churn commit on its own, isolated PR; (2) wiring `biome check src` into pre-commit/CI alongside the retained `eslint` + MDX lint.

---

## Hybrid design (the key correction over `biome migrate`)

`biome migrate eslint --write` did the **opposite of a hybrid**: it faithfully copied every `eslint-config-next` rule (all `@next/next/*`, `react/*`, `react-hooks/*`, `jsx-a11y/*`) **into** Biome. Keeping that as-is would mean **both tools lint the same concerns** = double-reporting + maintenance drift. It also defaulted the formatter to **tab indent + double quotes**, which is wrong for this repo.

The prototype `biome.json` instead:

- **Scopes Biome to `src` TS/JS only** (`src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}`), explicitly **excluding `src/content/**` (MDX)**, `.next`, `.contentlayer`, `out`, `build`, `next-env.d.ts`, and `packages/*/dist`. Biome has no MDX linter, so content stays 100% with ESLint (`eslint-plugin-mdx`) + remark/cspell.
- **Disables the Next/React/JSX-a11y rules** Biome's migration pulled in (`a11y` group off; `noImgElement`, `noHeadElement`, `noDocumentImportInPage`, `noNextAsyncClientComponent`, `useExhaustiveDependencies`, `useHookAtTopLevel`, `useJsxKeyInIterable`, etc. all off) — **ESLint owns these** via `eslint-config-next`. This is what makes it a true hybrid with no overlap.
- **Aligns the formatter to the repo's actual style** (verified against real source, not the migrate default): `indentStyle: space`, `indentWidth: 4`, `quoteStyle: single`, `semicolons: always`, `lineEnding: lf` (to match `.gitattributes` `eol=lf`).
- **Mirrors the existing ESLint overrides**: `scripts/**` may use CommonJS + `any`; tests + scripts may use `any`.
- **`organizeImports: off`** — ESLint doesn't enforce import ordering today, so leaving it on would create needless churn/conflict. Can be revisited as a deliberate follow-up.

A `lint:biome` / `lint:biome:fix` script pair was added to `package.json`.

---

## Findings

### 1. Feasibility — the hybrid works cleanly

- With `biome.json` present, **`pnpm exec eslint` still passes (exit 0)** and **vitest is still 110/110 green**. No interference.
- Division of labor is clean: **Biome** = base TS/JS correctness/style/format on `src`; **ESLint** = Next core-web-vitals + `@typescript-eslint` type-aware rules + `react-hooks` + MDX/content. No file is linted for the same concern by both once the Next/React/a11y groups are disabled on Biome's side.

### 2. Conflict / overlap analysis

- **Rule overlap (resolved):** the migrate report showed Biome can cover 57 of the ESLint rules — but the overlapping ones are exactly the Next/React/a11y rules I disabled on Biome. So **no runtime double-reporting**: Biome lints only base JS/TS concerns ESLint's Next preset doesn't (e.g. `useImportType`, `useOptionalChain`, `noUnusedImports`).
- **Formatting fights: none.** `eslint-config-next` is lint-only; the repo's sole custom formatting rule is `semi: always`, which **agrees** with Biome's `semicolons: always`. There is no Prettier in the active lint path to fight (a `.prettierrc` exists with only `{ "semi": true }`, but the codebase is **not** actually Prettier-formatted — it's 4-space, mixed quotes).
- **Rules ESLint must keep (Biome can't replicate):** `mdx/remark` (unknown to Biome), several `@next/next/*` (`no-html-link-for-pages`, `no-duplicate-head`, `no-typos`, …), and the repo's custom `no-restricted-syntax` ban on `as unknown` casts (not implemented in Biome). These justify retaining ESLint indefinitely.

### 3. Churn (one-time)

- **Format churn:** **112 files, ~2,796 insertions / ~872 deletions** (measured via `biome format src --write --line-ending=lf` then `git diff --stat`, i.e. real committed churn vs the LF-normalized git index, *excluding* the CRLF working-tree noise).
- **Churn is mechanical/benign:** quote normalization (double→single in files that used double), trailing commas in multiline constructs, and more aggressive line-wrapping of long signatures. All semantic no-ops.
- **CRLF caveat:** the raw working tree shows 117/118 files "needing format," but most of that is CRLF→LF — and git already stores these as LF (`.gitattributes eol=lf`). Setting Biome's `lineEnding: lf` keeps Biome aligned with git, so the *committed* churn is the 112-file figure above, not the inflated working-tree count.
- **Lint findings:** Biome's recommended set surfaces **6 errors, 40 warnings, 23 infos (69 total)** that ESLint does **not** flag today (baseline `eslint` = clean). **No parse errors** — all are genuine lint signal. ~20 are **safe-auto-fixable**. Highlights: `useImportType` (15, valuable under `isolatedModules`), `useNodejsImportProtocol` (16), `noUnusedImports` (9), `useOptionalChain` (6), `noNonNullAssertion` (5), `noArrayIndexKey` (5 errors), and `useIterableCallbackReturn` (1 error — a real bug-class). These are net-new value, not noise; triage + fix at root (don't blanket-disable).

### 4. Speed (this repo)

| Tool | Cold | Warm (avg of 3) |
|---|---|---|
| ESLint (`eslint`, full) | ~18.1s | ~3.4s |
| Biome lint (`biome lint src`) | — | **~0.40s** |
| Biome check (lint + format, `biome check src`) | — | **~0.42s** |

**~8–9x faster warm, ~45x faster cold** for the scope Biome owns. (Not perfectly apples-to-apples — ESLint also lints MDX and runs TS type-aware rules — but for base TS/JS the delta is an order of magnitude. The hybrid keeps ESLint in the loop, so total CI lint time = Biome (fast) + a still-needed ESLint pass; the win is mostly local/pre-commit DX and the auto-fix story.)

---

## Recommendation (detailed)

**Adopt the hybrid**, in this order:

1. **Land formatting first, in isolation.** Run `biome format src --write --line-ending=lf` and commit the ~112-file churn as a single `style: adopt Biome formatter (no-op reformat)` PR. Keeps it reviewable and out of feature diffs. Consider adding the commit to `.git-blame-ignore-revs`.
2. **Triage the 69 lint findings** in a follow-up: apply the ~20 safe fixes, hand-fix the 6 errors (esp. `useIterableCallbackReturn`), decide case-by-case on warnings. Fix at root — don't blanket-suppress.
3. **Wire into pre-commit + CI** next to the existing checks: `biome check src` (fast gate) **plus** the retained `eslint` (Next + type-aware) and `lint:mdx`/`content:checks` (MDX/content). Husky pre-commit can run `biome check --staged --write` for instant local formatting.
4. **Pin Biome exact** (done: `2.4.16`) and bump deliberately, matching the repo's no-float policy.

**Why not reject/defer:** the only real cost is the one-time churn (mitigated by an isolated commit), and the maintenance cost of "two tools" is low because their responsibilities are cleanly partitioned (Biome = base TS/JS + format; ESLint = Next + MDX + type-aware). The DX/perf and net-new lint signal clearly earn their keep.

**Worth learning:** Biome's single-binary lint+format+assist model and its `migrate` tooling — note the gotcha demonstrated here: `migrate` optimizes for *coverage parity*, not for a *hybrid*, so always invert its Next/React/a11y output when ESLint is being retained.
