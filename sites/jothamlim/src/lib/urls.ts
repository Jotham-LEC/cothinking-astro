// Where an entry lives: `urlOf(collection, id)`. The pages collection is the
// site's root (`pages/home` is `/`); every other collection sits under its
// landing page's address. A pure function: astro.config.mjs and the tests
// use it outside Astro too.
const PREFIX: Record<string, string> = {
  pages: '',
  essays: '/essays',
  notes: '/notes',
  projects: '/projects',
  publications: '/publications',
};

export function urlOf(collection: string, id: string): string {
  if (collection === 'pages' && id === 'home') return '/';
  const prefix = PREFIX[collection];
  if (prefix === undefined) throw new Error(`No address rule for the ${collection} collection (src/lib/urls.ts).`);
  return `${prefix}/${id}`;
}
