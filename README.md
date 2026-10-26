# Astro Starter

A blank Astro site for the team to build on. Static output, deployed on Netlify.

## Run locally

```bash
npm install
npm run dev     # or: netlify dev
```

## Structure

| What | Where |
| --- | --- |
| Site name, description, nav | `src/site.config.ts` |
| Header / footer | `src/components/` |
| Page layout (`<head>`, header, footer) | `src/layouts/BaseLayout.astro` |
| Home page (hero + content sections) | `src/pages/index.astro` |
| Content sections (Markdown) | `src/content/sections/` |
| Collection schemas | `src/content.config.ts` |
| Global styles | `src/styles/global.css` |

## Adding to a CMS later

Content is loaded through Astro content collections. To move to WordPress, Contentful or another CMS, replace the collection's `glob()` loader in `src/content.config.ts` with a CMS loader that returns the same fields.
