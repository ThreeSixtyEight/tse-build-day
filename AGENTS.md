# AGENTS.md

## Overview
Creative agency site for "Three Sixty Eight" (368°). Astro 7, static output, deployed on Netlify (`netlify.toml`: build `npm run build`, publish `dist`). No adapter, no server routes.

## Key directories
- `src/content.config.ts` — collection definitions + Zod schemas (`import { z } from 'astro/zod'`; Zod v4). Collections: `work` (Markdown, glob), `journal` (Markdown, glob, `author` is `reference('team')`), `services` and `team` (JSON arrays via `file()` loader, each item needs an `id`).
- `src/content/` — Markdown entries. `src/data/` — JSON entries.
- `src/lib/content.ts` — the only place pages fetch content (sorting/joins live here). Keep pages off direct `getCollection` calls.
- `src/lib/images.ts` — `cdn()` / `cdnSrcset()` build Netlify Image CDN URLs. Always use these for images; never link `/img/*.png` originals directly (they're full-res AI-generated PNGs).
- `src/loaders/wordpress.example.ts` — unused example custom loader showing the CMS migration path.
- `src/site.config.ts` — studio name, description, email, nav, socials. `siteName`/`siteDescription` feed the `<head>` in `src/layouts/BaseLayout.astro`.
- `src/components/` — Header, Footer, WorkCard. `src/styles/global.css` — design tokens and shared utilities.

## Conventions
- Design: warm paper (`--paper`), ink (`--ink`), one signal colour (`--signal` #ff4a1c). Fonts: Bricolage Grotesque (display/body), Instrument Serif italic (`.serif` accent words), IBM Plex Mono (`.label`). Per-project `accent` colour is passed as `--accent` CSS var.
- Component styles are scoped `<style>` blocks; shared bits (`.display`, `.label`, `.btn`, `.section-head`, `.prose`, `.reveal`) are global.
- `.reveal` elements fade in via an IntersectionObserver in BaseLayout; only hidden when JS is present (`html.js`). Respect reduced motion.
- Don't add `og:image` — the platform supplies it.

## Non-obvious decisions
- CMS-ready via Astro loaders: swapping a collection's `loader` is the migration path; schemas are the contract.
- `/.netlify/images` only works on Netlify or under `netlify dev`, not plain `astro dev`.
