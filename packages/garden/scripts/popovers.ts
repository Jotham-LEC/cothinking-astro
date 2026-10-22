/*! Adapted from Laradocs (https://github.com/petebishwhip/laradocs), Copyright (c) Pete Bishop, MIT License: see LICENSE-laradocs.md */
// Hover previews (components/Prose.astro), after Quartz: on a pointer device
// from the lg breakpoint up, resting on a link in the page's text shows a
// card beside it. A link to another page of this site shows the parts that
// page marks with [data-popover]; a link to another site (.external-link)
// shows only where it leads, built here without a request. A page's fetch
// starts once the pointer has rested on the link for a moment, so sweeping
// across a paragraph fetches nothing; the link shows that it is loading, and
// the card can be scrolled.
export function initPopovers() {
  if (!window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) return;
  const links = [...document.querySelectorAll<HTMLAnchorElement>('main a[href]')].filter((link) => {
    if (link.closest('nav, .not-prose, [data-stream]') || link.matches('.anchor, .button')) return false;
    if (link.classList.contains('external-link')) return true;
    // Another page of this site: not a file, and not a jump within this page.
    return link.origin === location.origin && link.pathname !== location.pathname && !/\.[a-z0-9]+$/i.test(link.pathname);
  });
  if (!links.length) return;
  const cache = new Map<string, Promise<HTMLElement | null>>();
  let open: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let fetchTimer: ReturnType<typeof setTimeout> | null = null;

  // A page of this site: the parts it marks for previewing, as nodes.
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
      box.appendChild(clone);
    }
    return box;
  }

  // Another site: no preview, only a card saying where the link leads.
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

  function preview(link: HTMLAnchorElement): Promise<HTMLElement | null> {
    if (link.classList.contains('external-link')) return Promise.resolve(sitePreview(link));
    const key = link.href.split('#')[0]!;
    if (!cache.has(key)) cache.set(key, pagePreview(key).catch(() => null));
    return cache.get(key)!;
  }

  function close() {
    open?.remove();
    open = null;
  }

  function show(link: HTMLAnchorElement, content: HTMLElement) {
    close();
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
    card.addEventListener('mouseleave', close);
    open = card;
  }

  for (const link of links) {
    link.addEventListener('mouseenter', () => {
      if (timer) clearTimeout(timer);
      if (fetchTimer) clearTimeout(fetchTimer);
      // After 100ms on the link its preview is fetched, and the link shows it is loading until it is ready;
      // the card waits for both the preview and 1.5s of rest, so passing over a link never opens one.
      const ready = new Promise<HTMLElement | null>((resolve) => {
        fetchTimer = setTimeout(() => {
          link.classList.add('is-previewing');
          const loading = preview(link);
          loading.then(() => link.classList.remove('is-previewing'));
          resolve(loading);
        }, 100);
      });
      timer = setTimeout(() => {
        ready.then((content) => {
          if (content && link.matches(':hover')) show(link, content);
        });
      }, 1500);
    });
    link.addEventListener('mouseleave', () => {
      if (timer) clearTimeout(timer);
      if (fetchTimer) clearTimeout(fetchTimer);
      link.classList.remove('is-previewing');
      setTimeout(() => {
        if (open && !open.matches(':hover') && !link.matches(':hover')) close();
      }, 150);
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  window.addEventListener('scroll', close, { passive: true });
}
