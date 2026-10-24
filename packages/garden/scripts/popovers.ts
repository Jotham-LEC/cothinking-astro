/*! Adapted from Laradocs (https://github.com/petebishwhip/laradocs), Copyright (c) Pete Bishop, MIT License: see LICENSE-laradocs.md */
// Hover previews (components/Prose.astro), after Quartz: on a pointer device
// from the lg breakpoint up, resting on a link in the page's text shows a
// card beside it. A link to another page of this site shows the parts that
// page marks with [data-popover]; a link to another site (.external-link)
// shows only where it leads, built here without a request. A page's fetch
// starts once the pointer has rested on the link for a moment, so sweeping
// across a paragraph fetches nothing; the link shows that it is loading, and
// the card can be scrolled.
/** Another page of this site (not a file, not a jump within this page) or another site; never navigation, buttons or anchors. */
function isPreviewable(link: HTMLAnchorElement): boolean {
  if (link.closest('nav, .not-prose, [data-stream]') || link.matches('.anchor, .button')) return false;
  if (link.classList.contains('external-link')) return true;
  return link.origin === location.origin && link.pathname !== location.pathname && !/\.[a-z0-9]+$/i.test(link.pathname);
}

/** A page of this site: the parts it marks for previewing, as nodes. */
async function pagePreview(url: string): Promise<HTMLElement | null> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) return null;
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  const parts = doc.querySelectorAll('[data-popover]');
  if (!parts.length) return null;
  const box = document.createElement('div');
  for (const part of parts) {
    const clone = part.cloneNode(true) as HTMLElement;
    for (const el of clone.querySelectorAll('[id]')) el.id = `popover-${el.id}`;
    for (const el of clone.querySelectorAll('script')) el.remove();
    // The card is not that page: its #links lead there, and its title is no second h1. (Its
    // pictures are no zoom buttons either: zoom.ts marks only the pictures already on this page.)
    for (const a of clone.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
      a.setAttribute('href', `${url}${a.getAttribute('href')}`);
    for (const h1 of clone.querySelectorAll('h1')) {
      const title = document.createElement('p');
      title.className = 'popover-title';
      title.append(...h1.childNodes);
      h1.replaceWith(title);
    }
    box.appendChild(clone);
  }
  return box;
}

/** Another site: no preview, only a card saying where the link leads. */
function sitePreview(link: HTMLAnchorElement): HTMLElement {
  const box = document.createElement('div');
  for (const [className, text] of [
    ['popover-host', `${link.hostname.replace(/^www\./, '')} ↗`],
    ['popover-url', link.href],
    ['popover-note', 'Opens another site.'],
  ]) {
    const p = document.createElement('p');
    p.className = className!;
    p.textContent = text!;
    box.appendChild(p);
  }
  return box;
}

/** What the previews remember: each page's preview (fetched once), the open card, the two timers. */
type Previews = {
  cache: Map<string, Promise<HTMLElement | null>>;
  open: HTMLElement | null;
  timer: ReturnType<typeof setTimeout> | null;
  fetchTimer: ReturnType<typeof setTimeout> | null;
};

function preview(state: Previews, link: HTMLAnchorElement): Promise<HTMLElement | null> {
  if (link.classList.contains('external-link')) return Promise.resolve(sitePreview(link));
  const key = link.href.split('#')[0]!;
  if (!state.cache.has(key))
    state.cache.set(
      key,
      pagePreview(key).catch(() => null),
    );
  return state.cache.get(key)!;
}

function close(state: Previews) {
  state.open?.remove();
  state.open = null;
}

/** The card beside the link: below it, or above when there is no room below, and inside the window. */
function show(state: Previews, link: HTMLAnchorElement, content: HTMLElement) {
  close(state);
  const card = document.createElement('div');
  card.className = 'popover';
  card.appendChild(content.cloneNode(true));
  document.body.appendChild(card);
  const rect = link.getBoundingClientRect();
  const left = Math.min(Math.max(16, rect.left), window.innerWidth - card.offsetWidth - 16);
  const top =
    rect.bottom + 8 + card.offsetHeight > window.innerHeight ? rect.top - card.offsetHeight - 8 : rect.bottom + 8;
  card.style.left = `${left}px`;
  card.style.top = `${Math.max(8, top)}px`;
  card.addEventListener('mouseleave', () => close(state));
  state.open = card;
}

function clearTimers(state: Previews) {
  if (state.timer) clearTimeout(state.timer);
  if (state.fetchTimer) clearTimeout(state.fetchTimer);
}

/**
 * After 100ms on the link its preview is fetched, and the link shows it is loading until it is ready;
 * the card waits for both the preview and 1.5s of rest, so passing over a link never opens one.
 */
function onEnter(state: Previews, link: HTMLAnchorElement) {
  clearTimers(state);
  const ready = new Promise<HTMLElement | null>((resolve) => {
    state.fetchTimer = setTimeout(() => {
      link.classList.add('is-previewing');
      const loading = preview(state, link);
      loading.then(() => link.classList.remove('is-previewing'));
      resolve(loading);
    }, 100);
  });
  state.timer = setTimeout(() => {
    ready.then((content) => {
      if (content && link.matches(':hover')) show(state, link, content);
    });
  }, 1500);
}

/** Leaving the link closes its card, unless the pointer has moved onto the card (or back) within 150ms. */
function onLeave(state: Previews, link: HTMLAnchorElement) {
  clearTimers(state);
  link.classList.remove('is-previewing');
  setTimeout(() => {
    if (state.open && !state.open.matches(':hover') && !link.matches(':hover')) close(state);
  }, 150);
}

export function initPopovers() {
  if (!window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) return;
  const links = [...document.querySelectorAll<HTMLAnchorElement>('main a[href]')].filter(isPreviewable);
  if (!links.length) return;
  const state: Previews = { cache: new Map(), open: null, timer: null, fetchTimer: null };
  for (const link of links) {
    link.addEventListener('mouseenter', () => onEnter(state, link));
    link.addEventListener('mouseleave', () => onLeave(state, link));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close(state);
  });
  window.addEventListener('scroll', () => close(state), { passive: true });
}
