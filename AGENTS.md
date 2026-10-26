# AGENTS.md

## Overview
Astro 7 scaffold for the Build Day fan site: Jon Batiste's story told through a New Orleans second line. Structure only, no design yet. Static output, deployed on Netlify (`netlify.toml`: build `npm run build`, publish `dist`). No adapter, no server routes. Intentionally unbranded and minimal.

## Key files
- `src/site.config.ts` — site name, description, nav. Feeds `<head>`, header and footer.
- `src/layouts/BaseLayout.astro` — HTML shell with Header and Footer.
- `src/pages/index.astro` — entry gate (hero), the second line (`sections` collection, sorted by `order`), Listen (official embeds) and End of the line (links to his official site).
- `src/pages/transcript.astro`, `src/pages/credits.astro` — transcript per section; media and quote credits plus the fan-site disclaimer.
- `src/content/sections/*.md` — one file per section; frontmatter mirrors the section flow (purpose, directives, interaction, media, caption, transcript, quotes).
- `src/data/quotes.json`, `src/data/credits.json` — `file()` collections, empty until sourced.
- `src/components/Notes.astro` — temporary build notes shown on the page; remove as final copy lands.
- `src/content.config.ts` — collection definitions (`import { z } from 'astro/zod'`; Zod v4). Swapping a collection's `loader` is the CMS migration path.
- `src/styles/global.css` — minimal tokens and `.wrap` container. Component styles are scoped `<style>` blocks.

## Conventions
- Keep the scaffold neutral: system fonts, no branding.
- Don't add `og:image` — the platform supplies it.
- Never invent a quote: Jon's words go in `quotes.json` with source and date only.
- Sound stays off until the visitor opts in; `data-section`, `data-join` and `data-sound-toggle` are hooks for the sound and analytics modules.
- Copy: nav 1–2 words, buttons 2–3, headlines 4–8, captions "Place, Year".
