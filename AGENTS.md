# AGENTS.md

## Overview
Blank Astro 7 starter for the team to build on. Static output, deployed on Netlify (`netlify.toml`: build `npm run build`, publish `dist`). No adapter, no server routes. Intentionally unbranded and minimal.

## Key files
- `src/site.config.ts` — site name, description, nav. Feeds `<head>`, header and footer.
- `src/layouts/BaseLayout.astro` — HTML shell with Header and Footer.
- `src/pages/index.astro` — hero plus content sections rendered from the `sections` collection (sorted by `order`).
- `src/content.config.ts` — collection definitions (`import { z } from 'astro/zod'`; Zod v4). Swapping a collection's `loader` is the CMS migration path.
- `src/styles/global.css` — minimal tokens and `.wrap` container. Component styles are scoped `<style>` blocks.

## Conventions
- Keep the scaffold neutral: system fonts, no branding.
- Don't add `og:image` — the platform supplies it.
