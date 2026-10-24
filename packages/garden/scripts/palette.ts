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

const items = (state: Palette) => [...state.list.querySelectorAll<HTMLAnchorElement>('li a')];
const visibleItems = (state: Palette) => items(state).filter((a) => !a.parentElement!.hasAttribute('hidden'));
const announce = (state: Palette, count: number) => {
  if (state.status) state.status.textContent = count ? `${count} ${count === 1 ? 'result' : 'results'}` : 'No results';
};

function setActive(state: Palette, i: number) {
  const visible = visibleItems(state);
  for (const a of items(state)) {
    a.classList.remove('is-active');
    a.parentElement!.setAttribute('aria-selected', 'false');
  }
  if (!visible.length) {
    state.activeIndex = -1;
    state.input.removeAttribute('aria-activedescendant');
    return;
  }
  state.activeIndex = Math.max(0, Math.min(visible.length - 1, i));
  const active = visible[state.activeIndex]!;
  active.classList.add('is-active');
  active.parentElement!.setAttribute('aria-selected', 'true');
  state.input.setAttribute('aria-activedescendant', active.parentElement!.id);
  active.scrollIntoView({ block: 'nearest' });
}

function localFilter(state: Palette, query: string) {
  const q = query.trim().toLowerCase();
  for (const a of items(state)) {
    a.parentElement!.toggleAttribute('hidden', !(!q || (a.dataset.label ?? '').includes(q)));
    a.classList.remove('is-active');
  }
  setActive(state, 0);
  announce(state, visibleItems(state).length);
}

const restore = (state: Palette) => {
  state.list.innerHTML = state.originalHtml;
};

/** Pagefind's hits as options, under a header each time a section's run begins. */
function renderResults(state: Palette, hits: Hit[]) {
  state.list.innerHTML = '';
  if (!hits.length) {
    const empty = document.createElement('li');
    empty.className = 'palette-empty';
    empty.setAttribute('role', 'presentation');
    empty.textContent = 'No results';
    state.list.appendChild(empty);
    setActive(state, -1);
    announce(state, 0);
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
        state.list.appendChild(header);
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
    state.list.appendChild(li);
  }
  setActive(state, 0);
  announce(state, hits.length);
}

async function remoteSearch(state: Palette, q: string) {
  const id = ++state.requestId;
  try {
    const pagefind = await loadPagefind();
    const search = await pagefind.search(q);
    const pages: PagefindResult[] = await Promise.all(search.results.slice(0, 20).map((r) => r.data()));
    if (id !== state.requestId) return;
    renderResults(
      state,
      pages.map((page) => ({
        title: page.meta.title,
        url: cleanUrl(page.url),
        section: page.meta.section ?? '',
        excerpt: page.excerpt,
      })),
    );
  } catch {
    // A failed search falls back to filtering the page titles.
    if (id !== state.requestId) return;
    restore(state);
    localFilter(state, q);
  }
}

function onInput(state: Palette) {
  const q = state.input.value.trim();
  if (state.debounce) clearTimeout(state.debounce);
  if (q.length < MIN_CHARS) {
    state.requestId++;
    restore(state);
    localFilter(state, '');
    return;
  }
  state.debounce = setTimeout(() => remoteSearch(state, q), 150);
}

// A search still on its way must not fill the list after it closes, or under an empty field when it opens again.
function forget(state: Palette) {
  if (state.debounce) clearTimeout(state.debounce);
  state.requestId++;
}

function open(state: Palette) {
  if (state.dialog.open) return;
  forget(state);
  state.input.value = '';
  restore(state);
  localFilter(state, '');
  state.dialog.showModal();
}

/** ⌘K/Ctrl+K toggles the palette; while it is open, Esc closes it, arrows and Ctrl+n/p move, Enter opens. */
function onKeydown(state: Palette, e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (state.dialog.open) state.dialog.close();
    else open(state);
    return;
  }
  if (!state.dialog.open) return;
  // The search field swallows Escape to clear itself; the dialog must close all the same.
  if (e.key === 'Escape') {
    e.preventDefault();
    state.dialog.close();
  } else if (e.ctrlKey && (e.key === 'n' || e.key === 'p')) {
    // Vim's Ctrl-n / Ctrl-p; plain j and k would be typed into the field.
    e.preventDefault();
    setActive(state, state.activeIndex + (e.key === 'n' ? 1 : -1));
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    setActive(state, state.activeIndex + 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActive(state, state.activeIndex - 1);
  } else if (e.key === 'Enter' && document.activeElement === state.input) {
    const target = visibleItems(state)[state.activeIndex];
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
  const state: Palette = {
    dialog,
    input,
    list,
    status: dialog.querySelector<HTMLElement>('[data-palette-status]'),
    originalHtml: list.innerHTML,
    activeIndex: -1,
    debounce: null,
    requestId: 0,
  };
  document.addEventListener('keydown', (e) => onKeydown(state, e));
  for (const button of document.querySelectorAll('[data-palette-open]'))
    button.addEventListener('click', () => open(state));
  input.addEventListener('input', () => onInput(state));
  dialog.addEventListener('close', () => forget(state));
}
