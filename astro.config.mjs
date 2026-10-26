// @ts-check
import { defineConfig } from 'astro/config';

// Static output — every page is pre-rendered at build time from content
// collections. Add the @astrojs/netlify adapter if server routes are needed
// (for example, live previews from a headless CMS).
export default defineConfig({
  site: 'https://astro-site-build.netlify.app',
});
