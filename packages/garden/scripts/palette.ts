/*! Adapted from Laradocs (https://github.com/petebishwhip/laradocs), Copyright (c) Pete Bishop, MIT License: see LICENSE-laradocs.md */
// ⌘K search (components/Palette.astro, a native dialog). Full-text matches
// come from Pagefind's index of the last build; if that fails (astro dev
// before any build), typing filters the pre-rendered titles instead. The
// dialog holds focus, closes on Esc or a click outside, and puts an open
// drawer away as it opens.
import { cleanUrl, loadPagefind, type PagefindResult } from './pagefind.ts';

const MIN_CHARS = 2;

type Hit = { title: string; url: string; section: string; excerpt: string };

/** Pagefind's excerpt is text with <mark> around the matches: built from text nodes and <mark> elements, never parsed as HTML. */
function marked(excerpt: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const textarea = document.createElement('textarea');
  excerpt.split(/<\/?mark>/).forEach((part, i) => {
    if (!part) return;
    textarea.innerHTML = part;
    if (i % 2) {
      const mark = document.createElement('mark');
      mark.className = 'palette-mark';
      mark.textContent = textarea.value;
      fragment.appendChild(mark);
    } else {
      fragment.appendChild(document.createTextNode(textarea.value));
    }
  });
  return fragment;
}

/** Results clustered by section, keeping the rank order of sections (by first hit) and of hits within each. */
function bySection(hits: Hit[]): Hit[] {
  const buckets = new Map<string, Hit[]>();
  for (const hit of hits) buckets.set(hit.section, [...(buckets.get(hit.section) ?? []), hit]);
  return [...buckets.values()].flat();
}

export function initPalette() {
  const palette = document.querySelector<HTMLDialogElement>('#palette');
  const input = palette?.querySelector<HTMLInputElement>('[data-palette-input]');
  const results = palette?.querySelector<HTMLElement>('[data-palette-results]');
  const status = palette?.querySelector<HTMLElement>('[data-palette-status]');
  if (!palette || !input || !results) return;
  const list = results;

  const originalHtml = list.innerHTML;
  let activeIndex = -1;
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let requestId = 0;

  const items = () => [...list.querySelectorAll<HTMLAnchorElement>('li a')];
  const visibleItems = () => items().filter((a) => !a.parentElement!.hasAttribute('hidden'));
  const announce = (count: number) => {
    if (status) status.textContent = count ? `${count} ${count === 1 ? 'result' : 'results'}` : 'No results';
  };
  function setActive(i: number) {
    const visible = visibleItems();
    if (!visible.length) {
      activeIndex = -1;
      return;
    }
    activeIndex = Math.max(0, Math.min(visible.length - 1, i));
    for (const a of items()) a.classList.remove('is-active');
    visible[activeIndex]!.classList.add('is-active');
    visible[activeIndex]!.scrollIntoView({ block: 'nearest' });
  }
  function localFilter(query: string) {
    const q = query.trim().toLowerCase();
    for (const a of items()) {
      a.parentElement!.toggleAttribute('hidden', !(!q || (a.dataset.label ?? '').includes(q)));
      a.classList.remove('is-active');
    }
    setActive(0);
    announce(visibleItems().length);
  }
  const restore = () => {
    list.innerHTML = originalHtml;
  };
  function renderResults(hits: Hit[]) {
    list.innerHTML = '';
    if (!hits.length) {
      const empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.textContent = 'No results';
      list.appendChild(empty);
      activeIndex = -1;
      announce(0);
      return;
    }
    let lastSection: string | null = null;
    for (const hit of bySection(hits)) {
      // A header the first time each section's run begins: an <li> with no anchor, so keyboard navigation skips it.
      if (hit.section !== lastSection) {
        lastSection = hit.section;
        if (hit.section !== '') {
          const header = document.createElement('li');
          header.className = 'palette-section';
          header.setAttribute('aria-hidden', 'true');
          header.textContent = hit.section;
          list.appendChild(header);
        }
      }
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = hit.url;
      a.dataset.label = hit.title.toLowerCase();
      const title = document.createElement('span');
      title.className = 'palette-title';
      title.textContent = hit.title;
      a.appendChild(title);
      if (hit.excerpt) {
        const excerpt = document.createElement('span');
        excerpt.className = 'palette-excerpt';
        excerpt.appendChild(marked(hit.excerpt));
        a.appendChild(excerpt);
      }
      li.appendChild(a);
      list.appendChild(li);
    }
    setActive(0);
    announce(hits.length);
  }
  async function remoteSearch(q: string) {
    const id = ++requestId;
    try {
      const pagefind = await loadPagefind();
      const search = await pagefind.search(q);
      const pages: PagefindResult[] = await Promise.all(search.results.slice(0, 20).map((r) => r.data()));
      if (id !== requestId) return;
      renderResults(
        pages.map((page) => ({
          title: page.meta.title,
          url: cleanUrl(page.url),
          section: page.meta.section ?? '',
          excerpt: page.excerpt,
        })),
      );
    } catch {
      // A failed search falls back to filtering the page titles.
      if (id !== requestId) return;
      restore();
      localFilter(q);
    }
  }
  function onInput() {
    const q = input!.value.trim();
    if (debounce) clearTimeout(debounce);
    if (q.length < MIN_CHARS) {
      requestId++;
      restore();
      localFilter('');
      return;
    }
    debounce = setTimeout(() => remoteSearch(q), 150);
  }

  function open() {
    if (palette!.open) return;
    input!.value = '';
    restore();
    localFilter('');
    palette!.showModal();
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette.open) palette.close();
      else open();
      return;
    }
    if (!palette.open) return;
    // Vim's Ctrl-n / Ctrl-p; plain j and k would be typed into the field.
    if (e.ctrlKey && (e.key === 'n' || e.key === 'p')) {
      e.preventDefault();
      setActive(activeIndex + (e.key === 'n' ? 1 : -1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(activeIndex - 1);
    } else if (e.key === 'Enter' && document.activeElement === input) {
      const target = visibleItems()[activeIndex];
      if (target) {
        e.preventDefault();
        window.location.href = target.href;
      }
    }
  });

  for (const button of document.querySelectorAll('[data-palette-open]')) button.addEventListener('click', open);
  input.addEventListener('input', onInput);
}
