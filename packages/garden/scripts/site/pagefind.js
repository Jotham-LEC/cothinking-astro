// Pagefind, for the palette and the 404's suggestions. The index exists only
// after a build (astro-pagefind serves the last one in dev), so the path is a
// variable: Vite leaves the import to the browser. Loaded and initialised once.
var pagefindUrl = '/pagefind/pagefind.js';
var loading = null;

/** @returns {Promise<any>} Pagefind's module (it ships no types). */
export function loadPagefind() {
  if (!loading) {
    loading = import(/* @vite-ignore */ pagefindUrl).then(function (module) {
      return module.init().then(function () {
        return module;
      });
    });
  }
  return loading;
}

// Pagefind's result URL, without the build's file name (`/x.html` → `/x`).
export function cleanUrl(url) {
  return url.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
}
