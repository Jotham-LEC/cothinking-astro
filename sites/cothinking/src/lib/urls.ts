// Where an entry lives: `urlOf(collection, id)`. The pages collection is the
// site's root (`pages/home` is `/`), and so are the problems I fix; the wiki
// and the work sit under their landing pages. A pure function:
// astro.config.mjs and the tests use it outside Astro too.
const PREFIX: Record<string, string> = { pages: '', problems: '', wiki: '/wiki', work: '/work' };

export function urlOf(collection: string, id: string): string {
  if (collection === 'pages' && id === 'home') return '/';
  const prefix = PREFIX[collection];
  if (prefix === undefined) throw new Error(`No address rule for the ${collection} collection (src/lib/urls.ts).`);
  return `${prefix}/${id}`;
}
