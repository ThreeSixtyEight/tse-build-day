import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every collection is backed by an Astro content loader. Today they read local
// Markdown/JSON files; to move to a headless CMS (WordPress, Contentful, ...)
// swap the `loader` for a CMS loader — see src/loaders/wordpress.example.ts.
// Keep the schemas as the contract so pages don't need to change.

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    summary: z.string(),
    year: z.number().int(),
    disciplines: z.array(z.string()),
    cover: z.string(),
    coverAlt: z.string(),
    accent: z.string().default('#ff4a1c'),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  }),
});

const services = defineCollection({
  loader: file('./src/data/services.json'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    capabilities: z.array(z.string()),
    order: z.number(),
  }),
});

const team = defineCollection({
  loader: file('./src/data/team.json'),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    favouriteTool: z.string(),
    order: z.number(),
  }),
});

const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    author: reference('team'),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { work, services, team, journal };
