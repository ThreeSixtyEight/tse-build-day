# Three Sixty Eight — Studio Website

The website for Three Sixty Eight, an independent creative agency. Built together by the whole team on Build Day with [Astro](https://astro.build) and deployed on Netlify.

## Tech

- **Astro 7** — static site, every page pre-rendered at build time
- **Astro content collections** — case studies, journal posts, services and team live as Markdown/JSON in the repo
- **Netlify Image CDN** — images are resized and converted to WebP on the fly via `/.netlify/images`
- Plain scoped CSS (no framework); fonts from Google Fonts

## Run locally

```bash
npm install
netlify dev        # recommended: emulates the Netlify Image CDN
# or
npm run dev        # Astro only — images won't load since /.netlify/images isn't available
```

## Adding content

| What | Where |
| --- | --- |
| Case study | New `.md` file in `src/content/work/` |
| Journal post | New `.md` file in `src/content/journal/` (`author` = a team `id`) |
| Team member | Add an entry to `src/data/team.json` |
| Service | Add an entry to `src/data/services.json` |
| Studio name, email, nav, socials | `src/site.config.ts` |

Images go in `public/img/` and are referenced as `/img/<file>`. Frontmatter is validated against the schemas in `src/content.config.ts`, so the build will tell you if a field is missing.

## Moving to a headless CMS later

Every collection is defined by a content **loader** in `src/content.config.ts`. To move a collection to WordPress, Contentful, or another CMS, replace its `glob()`/`file()` loader with a CMS loader that maps the CMS fields onto the existing schema. Pages read content through `src/lib/content.ts` and don't need to change.

`src/loaders/wordpress.example.ts` is a working starting point for WordPress. Keep CMS tokens in Netlify environment variables, and add remote image domains to an `[images]` block in `netlify.toml` so they can be served via the Image CDN.
