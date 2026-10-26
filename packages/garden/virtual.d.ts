// The modules garden/config.mjs makes up for Vite.
declare module 'virtual:garden/link-index' {
  /** The link index the Markdown pipeline resolves against: both sites' published pages (lib/scan.ts `siteIndex`). */
  export const linkIndex: () => import('./lib/linkIndex.ts').LinkIndex;
}
