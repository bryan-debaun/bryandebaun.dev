# ADR 0001 — Choose fonts and loading strategy

Date: 2026-01-27

Status: Accepted

## Context

Design requires a clean typographic system: a neutral humanist sans for body/UI text and a display font for headings and hero text. The design team selected **Inter** (body/UI) and **Orbitron** (display/headings).

## Decision

We will:

- Use Next.js' `next/font` helper (`@next/font` replacement in Next 16+) to load **Inter** and **Orbitron** from Google Fonts.
- Prefer `next/font` for automatic subsetting, preload, and `font-display: swap` behavior.
- Expose typographic tokens (font-family and type scale) via `src/styles/tokens.css` and apply them in `src/app/globals.css`.
- Only self-host WOFF2 subsets (placed in `public/fonts/`) if `next/font` cannot meet performance or licensing requirements.

## Consequences

- Pros:
  - Automatic subsetting and preload via `next/font` improves FCP and CLS when used correctly.
  - Centralized tokens make type scale updates and accessibility audits straightforward.
- Cons:
  - Dependency on external font provider when using the Google-hosted font path; self-hosting adds complexity but gives full control.

## Rollout / Rollback

- Implement in a feature branch and deploy a preview. Validate Lighthouse FCP and font best-practices.
- If audit fails or regulatory needs demand self-hosting, add WOFF2 subsets to `public/fonts/` and update `layout.tsx` to use `local`/`file` sources.

## Notes

- License: Inter and Orbitron are open-source (SIL/Open Font License/Apache as applicable); confirm licenses before self-hosting. See linked upstream font repos for final verification.
- Performance target: limit initial font payload (WOFF2) to under 100KB combined for critical fonts (subset variable approach preferred).

Author: Bryan DeBaun
