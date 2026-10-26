import type { Loader } from 'astro/loaders';

/**
 * Example: a WordPress content loader (not wired up yet).
 *
 * To move the `journal` collection to WordPress, import this in
 * src/content.config.ts and replace the `glob(...)` loader:
 *
 *   loader: wordpressPostsLoader({ baseUrl: 'https://cms.example.com' }),
 *
 * Keep the collection's schema the same, and map CMS fields onto it here.
 * The same pattern works for Contentful (use its Content Delivery API and
 * read the token from an environment variable — never hard-code it).
 */
export function wordpressPostsLoader({ baseUrl }: { baseUrl: string }): Loader {
  return {
    name: 'wordpress-posts',
    load: async ({ store, parseData, generateDigest, logger }) => {
      logger.info(`Fetching posts from ${baseUrl}`);
      const res = await fetch(`${baseUrl}/wp-json/wp/v2/posts?per_page=100&_embed`);
      if (!res.ok) throw new Error(`WordPress responded with ${res.status}`);
      const posts: any[] = await res.json();

      store.clear();
      for (const post of posts) {
        const data = await parseData({
          id: post.slug,
          data: {
            title: post.title.rendered,
            excerpt: post.excerpt.rendered.replace(/<[^>]+>/g, '').trim(),
            date: post.date,
            // Map the WordPress author to a `team` entry id.
            author: post._embedded?.author?.[0]?.slug ?? 'maya-okafor',
            tags: [],
          },
        });
        store.set({
          id: post.slug,
          data,
          rendered: { html: post.content.rendered },
          digest: generateDigest(post.modified),
        });
      }
    },
  };
}
