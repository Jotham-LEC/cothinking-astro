/*! Adapted from Laradocs (https://github.com/petebishwhip/laradocs), Copyright (c) Pete Bishop, MIT License: see LICENSE-laradocs.md */
// ⌘K search (components/Palette.astro, a native dialog). Full-text matches
// come from Pagefind's index of the last build; if that fails (astro dev
// before any build), typing filters the pre-rendered titles instead. The
// dialog holds focus, closes on Esc or a click outside, and puts an open
// drawer away as it opens. The field is a combobox over the results'
// listbox: the active option is its aria-activedescendant.
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

/** The palette's parts and what it remembers between keystrokes. */
type Palette = {
  dialog: HTMLDialogElement;
  input: HTMLInputElement;
  list: HTMLElement;
  status: HTMLElement | null;
  /** The pre-rendered page list, put back when the query is cleared. */
  originalHtml: string;
  activeIndex: number;
  debounce: ReturnType<typeof setTimeout> | null;
  /** Bumped by each search, so an answer that comes back late is dropped. */
  requestId: number;
};

const items = (p: Palette) => [...p.list.querySelectorAll<HTMLAnchorElement>('li a')];
const visibleItems = (p: Palette) => items(p).filter((a) => !a.parentElement!.hasAttribute('hidden'));
const announce = (p: Palette, count: number) => {
  if (p.status) p.status.textContent = count ? `${count} ${count === 1 ? 'result' : 'results'}` : 'No results';
};

function setActive(p: Palette, i: number) {
  const visible = visibleItems(p);
  for (const a of items(p)) {
    a.classList.remove('is-active');
    a.parentElement!.setAttribute('aria-selected', 'false');
  }
  if (!visible.length) {
    p.activeIndex = -1;
    p.input.removeAttribute('aria-activedescendant');
    return;
  }
  p.activeIndex = Math.max(0, Math.min(visible.length - 1, i));
  const active = visible[p.activeIndex]!;
  active.classList.add('is-active');
  active.parentElement!.setAttribute('aria-selected', 'true');
  p.input.setAttribute('aria-activedescendant', active.parentElement!.id);
  active.scrollIntoView({ block: 'nearest' });
}

function localFilter(p: Palette, query: string) {
  const q = query.trim().toLowerCase();
  for (const a of items(p)) {
    a.parentElement!.toggleAttribute('hidden', !(!q || (a.dataset.label ?? '').includes(q)));
    a.classList.remove('is-active');
  }
  setActive(p, 0);
  announce(p, visibleItems(p).length);
}

const restore = (p: Palette) => {
  p.list.innerHTML = p.originalHtml;
};

/** Pagefind's hits as options, under a header each time a section's run begins. */
function renderResults(p: Palette, hits: Hit[]) {
  p.list.innerHTML = '';
  if (!hits.length) {
    const empty = document.createElement('li');
    empty.className = 'palette-empty';
    empty.setAttribute('role', 'presentation');
    empty.textContent = 'No results';
    p.list.appendChild(empty);
    setActive(p, -1);
    announce(p, 0);
    return;
  }
  let lastSection: string | null = null;
  let n = 0;
  for (const hit of bySection(hits)) {
    // A header the first time each section's run begins: an <li> with no anchor, so keyboard navigation skips it.
    if (hit.section !== lastSection) {
      lastSection = hit.section;
      if (hit.section !== '') {
        const header = document.createElement('li');
        header.className = 'palette-section';
        header.setAttribute('role', 'presentation');
        header.setAttribute('aria-hidden', 'true');
        header.textContent = hit.section;
        p.list.appendChild(header);
      }
    }
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.id = `palette-hit-${n++}`;
    li.setAttribute('aria-selected', 'false');
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
    p.list.appendChild(li);
  }
  setActive(p, 0);
  announce(p, hits.length);
}

async function remoteSearch(p: Palette, q: string) {
  const id = ++p.requestId;
  try {
    const pagefind = await loadPagefind();
    const search = await pagefind.search(q);
    const pages: PagefindResult[] = await Promise.all(search.results.slice(0, 20).map((r) => r.data()));
    if (id !== p.requestId) return;
    renderResults(
      p,
      pages.map((page) => ({
        title: page.meta.title,
        url: cleanUrl(page.url),
        section: page.meta.section ?? '',
        excerpt: page.excerpt,
      })),
    );
  } catch {
    // A failed search falls back to filtering the page titles.
    if (id !== p.requestId) return;
    restore(p);
    localFilter(p, q);
  }
}

function onInput(p: Palette) {
  const q = p.input.value.trim();
  if (p.debounce) clearTimeout(p.debounce);
  if (q.length < MIN_CHARS) {
    p.requestId++;
    restore(p);
    localFilter(p, '');
    return;
  }
  p.debounce = setTimeout(() => remoteSearch(p, q), 150);
}

// A search still on its way must not fill the list after it closes, or under an empty field when it opens again.
function forget(p: Palette) {
  if (p.debounce) clearTimeout(p.debounce);
  p.requestId++;
}

function open(p: Palette) {
  if (p.dialog.open) return;
  forget(p);
  p.input.value = '';
  restore(p);
  localFilter(p, '');
  p.dialog.showModal();
}

/** ⌘K/Ctrl+K toggles the palette; while it is open, Esc closes it, arrows and Ctrl+n/p move, Enter opens. */
function onKeydown(p: Palette, e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (p.dialog.open) p.dialog.close();
    else open(p);
    return;
  }
  if (!p.dialog.open) return;
  // The search field swallows Escape to clear itself; the dialog must close all the same.
  if (e.key === 'Escape') {
    e.preventDefault();
    p.dialog.close();
  } else if (e.ctrlKey && (e.key === 'n' || e.key === 'p')) {
    // Vim's Ctrl-n / Ctrl-p; plain j and k would be typed into the field.
    e.preventDefault();
    setActive(p, p.activeIndex + (e.key === 'n' ? 1 : -1));
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    setActive(p, p.activeIndex + 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActive(p, p.activeIndex - 1);
  } else if (e.key === 'Enter' && document.activeElement === p.input) {
    const target = visibleItems(p)[p.activeIndex];
    if (target) {
      e.preventDefault();
      window.location.href = target.href;
    }
  }
}

export function initPalette() {
  const dialog = document.querySelector<HTMLDialogElement>('#palette');
  const input = dialog?.querySelector<HTMLInputElement>('[data-palette-input]');
  const list = dialog?.querySelector<HTMLElement>('[data-palette-results]');
  if (!dialog || !input || !list) return;
  const p: Palette = {
    dialog,
    input,
    list,
    status: dialog.querySelector<HTMLElement>('[data-palette-status]'),
    originalHtml: list.innerHTML,
    activeIndex: -1,
    debounce: null,
    requestId: 0,
  };
  document.addEventListener('keydown', (e) => onKeydown(p, e));
  for (const button of document.querySelectorAll('[data-palette-open]'))
    button.addEventListener('click', () => open(p));
  input.addEventListener('input', () => onInput(p));
  dialog.addEventListener('close', () => forget(p));
}
