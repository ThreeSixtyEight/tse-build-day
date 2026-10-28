import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Collections are swappable: to move to a headless CMS later, replace a
// collection's `loader` with a CMS loader and keep the schema.

// The second line: one Markdown file per section, in parade order. The body is
// the section's draft copy; the frontmatter mirrors the strategists' section flow.
const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(100),
    purpose: z.string().default('TBD'),
    directives: z.array(z.string()).default([]),
    interaction: z.string().default('TBD'),
    media: z.enum(['video', 'still', 'interaction', 'embed', 'text']).optional(),
    // "Place, Year"
    caption: z.string().optional(),
    // Words spoken or sung in this section, shown on the transcript page.
    transcript: z.string().optional(),
    quotes: z.array(reference('quotes')).default([]),
    // A chapter as full-screen scenes in order (intro, resolution), each a background photo and its copy.
    // photo: an Unsplash photo id, credited in src/data/credits.json. Without scenes the section shows its body copy.
    scenes: z.array(z.object({ text: z.string(), photo: z.string().optional() })).default([]),
  }),
});

// Jon's words only as sourced, dated quotes. Never invent one.
const quotes = defineCollection({
  loader: file('./src/data/quotes.json'),
  schema: z.object({
    text: z.string(),
    source: z.string(),
    date: z.string(),
    url: z.url().optional(),
  }),
});

// Every licensed photo, clip, embed and culture source used on the site.
const credits = defineCollection({
  loader: file('./src/data/credits.json'),
  schema: z.object({
    type: z.enum(['photo', 'footage', 'music', 'audio', 'culture', 'other']),
    item: z.string(),
    credit: z.string(),
    url: z.url().optional(),
  }),
});

export const collections = { sections, quotes, credits };
