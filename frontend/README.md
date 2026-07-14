This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Help Documentation

Help content is defined in `src/data/helpContent.ts` as the **single source of truth**. This file is consumed by:

- **In-app help pages** (`/help/*`) render the content directly via `renderMarkdown()`.
- **Contextual help panels** (`<HelpIcon>` components on Settings, Search, and New Illustration pages) show a slide-in panel with the topic's compact content.
- **Markdown docs** (`docs/`) are generated automatically on every build.

### Generating Markdown Docs

The `docs/` directory contains generated `.md` and `.json` files. These are **derived artifacts** — do not edit them directly. Instead, edit `src/data/helpContent.ts` and rebuild.

```bash
# Regenerate docs manually
npm run generate:help

# Docs are also regenerated automatically before `npm run build`
npm run build
```

The generation script (`scripts/generate-help-docs.ts`) reads `helpContent.ts` and writes:
- `docs/pages/*.md` — Page guides with YAML frontmatter
- `docs/features/*.md` — Feature guides (same content, different grouping)
- `docs/tours/*_tour.json` — Interactive tour step definitions
