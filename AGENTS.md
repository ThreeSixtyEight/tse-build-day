# AGENTS.md

## Overview
Astro 7 scaffold for the Build Day fan site: Jon Batiste's story told through a New Orleans second line. Structure only, no design yet. Static output, deployed on Netlify (`netlify.toml`: build `npm run build`, publish `dist`). No adapter, no server routes. Intentionally unbranded and minimal.

## Key files
- `src/site.config.ts` — site name, description, official site link. Feeds `<head>`, header and footer.
- `src/layouts/BaseLayout.astro` — HTML shell with Header and Footer.
- `src/pages/index.astro` — the whole site on one page: entry gate (hero), the second line (`sections` collection, sorted by `order`), Listen (official embeds), End of the line (links to his official site), Transcript and Credits.
- `src/content/sections/*.md` — one file per section; frontmatter mirrors the section flow (purpose, directives, interaction, media, caption, transcript, quotes).
- `src/data/quotes.json`, `src/data/credits.json` — `file()` collections, empty until sourced.
- `src/components/FallIn.astro` — prototype: scroll drops the camera into the second line and the visitor picks the instrument they play (snare, trumpet, trombone, tuba). Reduced motion gets four held stills; no WebGL gets a static block.
- `src/scripts/fall-in/scene.ts` — renderer, lighting and the Theatre.js hookup. `world.ts` (street layout, figures, instruments) and `realism.ts` (Creole facades, galleries, ferns, street details) are ported from Nick's Second Line World Studio.
- `public/fall-in/` — CC0 Poly Haven textures and sky HDR (credited in `src/data/credits.json`). Missing files fall back to flat colours.
- `src/theatre/fall-in.state.json` — the Theatre.js keyframes. Edit at `/?studio` on `npm run dev`, export the project and replace this file. The editor (`@theatre/studio`, AGPL) is dev-only and never ships.
- `src/components/Notes.astro` — temporary build notes shown on the page; remove as final copy lands.
- `src/content.config.ts` — collection definitions (`import { z } from 'astro/zod'`; Zod v4). Swapping a collection's `loader` is the CMS migration path.
- `src/styles/global.css` — minimal tokens and `.wrap` container. Component styles are scoped `<style>` blocks.

## Conventions
- Keep the scaffold neutral: system fonts, no branding.
- Don't add `og:image` — the platform supplies it.
- Never invent a quote: Jon's words go in `quotes.json` with source and date only.
- Sound stays off until the visitor opts in; `data-section`, `data-join` and `data-sound-toggle` are hooks for the sound and analytics modules.
- One page, no nav. Header is the site name and the sound toggle; footer links to `#transcript` and `#credits`.
- Copy: buttons 2–3, headlines 4–8, captions "Place, Year".
