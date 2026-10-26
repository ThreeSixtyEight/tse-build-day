import { getCollection, getEntry } from 'astro:content';

// Thin data-access layer. Pages import from here instead of calling
// getCollection directly, so sorting/filtering rules live in one place and a
// future CMS migration only touches content.config.ts (and maybe this file).

export async function getWork() {
  const items = await getCollection('work');
  return items.sort((a, b) => a.data.order - b.data.order);
}

export async function getFeaturedWork() {
  return (await getWork()).filter((item) => item.data.featured);
}

export async function getServices() {
  const items = await getCollection('services');
  return items.sort((a, b) => a.data.order - b.data.order);
}

export async function getTeam() {
  const items = await getCollection('team');
  return items.sort((a, b) => a.data.order - b.data.order);
}

export async function getJournal() {
  const posts = await getCollection('journal');
  const withAuthors = await Promise.all(
    posts.map(async (post) => ({ post, author: await getEntry(post.data.author) })),
  );
  return withAuthors.sort((a, b) => b.post.data.date.getTime() - a.post.data.date.getTime());
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
