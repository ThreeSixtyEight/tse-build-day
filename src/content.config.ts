import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Content sections on the home page, one Markdown file each. To move to a
// headless CMS later, swap the `loader` for a CMS loader and keep the schema.
const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(100),
  }),
});

export const collections = { sections };
