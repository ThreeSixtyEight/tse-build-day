# Build Day Site

The scaffold for the Build Day fan site: Jon Batiste's story told through a New Orleans second line. Structure only, no design yet. Static output, deployed on Netlify.

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
| Home page (entry gate, the line, listen, end) | `src/pages/index.astro` |
| Transcript page | `src/pages/transcript.astro` |
| Credits page | `src/pages/credits.astro` |
| Second line sections (Markdown, one per section) | `src/content/sections/` |
| Sourced, dated quotes | `src/data/quotes.json` |
| Media and culture credits | `src/data/credits.json` |
| Build notes / quote blocks | `src/components/Notes.astro`, `src/components/Quote.astro` |
| Collection schemas | `src/content.config.ts` |
| Global styles | `src/styles/global.css` |

## Adding to a CMS later

Content is loaded through Astro content collections. To move to WordPress, Contentful or another CMS, replace the collection's `glob()` loader in `src/content.config.ts` with a CMS loader that returns the same fields.
