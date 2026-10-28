# AGENTS.md

## Overview
Astro 7 scaffold for the Build Day fan site: Jon Batiste's story told through a New Orleans second line. Structure only, no design yet. Static output, deployed on Netlify (`netlify.toml`: build `npm run build`, publish `dist`). No adapter, no server routes. Intentionally unbranded and minimal.

## Key files
- `src/site.config.ts` — site name, description, official site link. Feeds `<head>`, header and footer.
- `src/layouts/BaseLayout.astro` — HTML shell with Header and Footer.
- `src/pages/index.astro` — the whole site on one page: hero (scrolls into the street scene), the second line (`sections` collection, sorted by `order`), Listen (official embeds), End of the line (links to his official site), Transcript and Credits.
- `src/content/sections/*.md` — one file per section; frontmatter mirrors the section flow (purpose, directives, interaction, media, caption, transcript, quotes). A chapter with `scenes` (photo + text each, e.g. intro and resolution) shows one full-screen panel per scene instead of its body.
- `src/data/quotes.json`, `src/data/credits.json` — `file()` collections, empty until sourced.
- `src/content.config.ts` — collection definitions (`import { z } from 'astro/zod'`; Zod v4). Swapping a collection's `loader` is the CMS migration path.
- `src/styles/global.css` — minimal tokens and `.wrap` container. Component styles are scoped `<style>` blocks.

## Conventions
- Keep the scaffold neutral: system fonts, no branding.
- Don't add `og:image` — the platform supplies it.
- Never invent a quote: Jon's words go in `quotes.json` with source and date only.
- Sound stays off until the visitor opts in; `data-section` and `data-sound-toggle` are hooks for the sound and analytics modules.
- One page, no nav. Header is the site name and the sound toggle; footer links to the instruments and game pages.
- Copy: buttons 2–3, headlines 4–8, captions "Place, Year".
- Text blocks use the shared classes in `global.css`: `.eyebrow.eyebrow--caps` (via `Eyebrow.astro`), `.heading` with `.heading--xl` or `.heading--lg`, `.body` (`--lead`, `--xl`), `.caption`, and `.align-left` / `.align-center` / `.align-right` on the block's container. Don't restyle a block's own h2 or p.
