# bryandebaun.dev

Personal website for **Bryan DeBaun** — built with Next.js, TypeScript, and Tailwind CSS.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

This project is designed for deployment to Vercel. Connect your GitHub repo in Vercel and add the custom domain (`bryandebaun.dev`) after DNS is configured.

## Notes

- MDX/Contentlayer integration is planned, but currently the `next-contentlayer` package is incompatible with Next.js 16; see Issue #2 for tracking.
- CI runs on push and PRs and performs build and lint checks.
