# Design & Styling Handoff — Issue #9

## Overview

This handoff provides context, recommended changes, and an actionable task list for the coder to implement design & styling improvements (Tailwind-based prototype + accessible component kit).

## Repo snapshot

- Next.js 16 + React 19
- Tailwind v4 and `@tailwindcss/postcss` present in `package.json`
- `postcss.config.mjs` includes `"@tailwindcss/postcss": {}`
- `src/app/globals.css` currently contains `@import "tailwindcss"` and custom CSS variables (light/dark colors)
- `src/app/layout.tsx` loads Google fonts and uses Tailwind utility classes (header, body, `prose` class used on blog pages)
- Blog is powered by Contentlayer (`contentlayer.config.ts`) using MDX documents in `src/content/posts`

## Goals

- Ensure Tailwind is configured properly and `prose` styles work reliably (light & dark).
- Implement a minimal accessible component (e.g., `Button`) to demonstrate patterns.
- Add accessibility and responsiveness verification steps.

## Local setup & verification

1. npm install
2. npm run dev (or `npm run run-content && npm run build` for a production check)
3. Open <http://localhost:3000> and verify blog pages (`/blog` and `/blog/[slug]`) render as expected.

## Recommended tasks (priority order)

1. **Add Tailwind config & Typography plugin**
   - Add `tailwind.config.cjs` and include `content` globs: `['./src/**/*.{ts,tsx,js,jsx}', './src/content/**/*.{md,mdx}']`.
   - Install `@tailwindcss/typography` and add it to `plugins`.
   - Choose `darkMode: 'class'` or `'media'` in config (I recommend `'class'` for explicit theme control).

2. **Convert `globals.css` to canonical Tailwind directives**
   - Replace `@import "tailwindcss"` with:

     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

   - Keep or move the `:root` color variables below those directives.

3. **Add minimal design tokens and theming**
   - Add colours and fonts to `theme.extend` and expose important tokens as CSS variables to keep runtime theming flexible.

4. **Create a small component kit**
   - Add `src/components/Button.tsx` using Tailwind utility classes and proper focus/aria attributes.
   - Optional: use Radix UI for primitives (Dialog, Dropdown) in `src/components`.

5. **Testing & Accessibility**
   - Manual checks: keyboard navigation, color contrast (WebAIM color contrast), screen reader smoke test.
   - Automated checks: integrate `axe-core` in unit tests or use Lighthouse/a11y CI step.

## Example config snippet

```js
// tailwind.config.cjs
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,js,jsx}', './src/content/**/*.{md,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          500: '#4f46e5',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

## PR checklist for coder

- [ ] Add `tailwind.config.cjs` and update `package.json` if necessary.
- [ ] Replace `globals.css` directives and preserve existing CSS variables.
- [ ] Install `@tailwindcss/typography` and add minimal dark-mode `prose` styles.
- [ ] Add a small `Button` component and replace one header link to use the component.
- [ ] Add screenshots or GIFs demonstrating before/after.
- [ ] Include a short test or automated a11y check.
- [ ] Run `npm run verify:local` and ensure build + content checks pass.

### Decisions for initial work

- **Dark mode:** using `darkMode: 'class'` (explicit `.dark` class on the root), as recommended in the handoff.
- **Component kit:** keeping the component kit minimal for this iteration (no Radix/shadcn primitives included — can be added later).
- **Colors:** using the example color tokens from the handoff; the color palette can be refined later.
- **Branch:** initial work will be implemented on `feature/tailwind-styling`.

## Useful links

- Tailwind CSS — <https://tailwindcss.com/docs>
- Typography plugin — <https://github.com/tailwindlabs/tailwindcss-typography>
- Radix UI — <https://www.radix-ui.com/>
- shadcn/ui — <https://ui.shadcn.com/>
- UnoCSS — <https://unocss.dev/>

---

If anything in this handoff is unclear or you'd like me to open the PR and implement the initial config+globals change, reply "Start PR" and I will create a branch with the minimal changes requested.
