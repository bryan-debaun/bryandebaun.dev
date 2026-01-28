# ADR 0001: Tailwind-first mobile nav & responsiveness fixes

Date: 2026-01-28

Status: Accepted

## Context

Issue #33 tracks mobile layout and responsiveness problems. The site uses Tailwind CSS and global CSS across pages (header in `src/app/layout.tsx`, global styles in `src/app/globals.css`). Observed problems include header/nav overflow on small screens, occasional horizontal scrolling, and touch target sizes below guidelines.

## Decision

Adopt a Tailwind-first approach:

- Implement an accessible mobile navigation (toggleable menu hidden on `md+` via `hidden md:flex` and mobile menu using `md:hidden`).
- Use Tailwind utilities for truncation and overflow (`flex-1 min-w-0`, `overflow-hidden truncate`).
- Add minimal scoped CSS only when Tailwind utilities cannot express required behavior (e.g., a small animation or a global rule that applies `max-w-full` and `h-auto` to images using `@apply`).

Alternative considered:

- CSS-only stacked nav (no JS) — rejected due to poorer UX for larger navs.
- Use Headless UI / Radix Disclosure — acceptable as an implementation option; prefer a lightweight, accessible homegrown toggle unless ARIA concerns require third-party.

## Consequences

- Minimal added dependencies and small change surface area.
- Accessible patterns will be required; testing and screenshots at common device widths should be included in PRs.

## Notes

- Branch: `feature/33-tailwind-mobile-nav`
- See issue: [#33](https://github.com/bryan-debaun/bryandebaun.dev/issues/33)

Owner: @bryan-debaun

---

(End of ADR)
