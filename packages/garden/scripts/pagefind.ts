// Pagefind, for the palette and the 404's suggestions. The index exists only
// after a build (astro-pagefind serves the last one in dev), so the path is a
// variable: Vite leaves the import to the browser. Loaded and initialised once.
export type PagefindResult = { url: string; excerpt: string; meta: { title: string; section?: string } };
export type Pagefind = {
  init: () => Promise<void>;
  search: (query: string) => Promise<{ results: { data: () => Promise<PagefindResult> }[] }>;
};

const pagefindUrl = '/pagefind/pagefind.js';
let loading: Promise<Pagefind> | null = null;

export function loadPagefind(): Promise<Pagefind> {
  loading ??= import(/* @vite-ignore */ pagefindUrl).then(async (module: Pagefind) => {
    await module.init();
    return module;
  });
  return loading;
}

/** Pagefind's result URL, without the build's file name (`/x.html` → `/x`). */
export const cleanUrl = (url: string): string => url.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
