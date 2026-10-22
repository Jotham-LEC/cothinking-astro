/*! Adapted from Laradocs (https://github.com/petebishwhip/laradocs), Copyright (c) Pete Bishop, MIT License: see LICENSE-laradocs.md */
// Vim-style keys (the card is components/Keys.astro): / or : searches, j
// and k scroll, g g and G go to the top and bottom, g h goes home, z toggles
// reader mode, ? opens the card that lists them. They are ignored while
// typing, with a modifier held, or while a dialog is open, and the card's
// checkbox turns them all off (⌘K stays), remembered in localStorage('keys').
// Also the search button's hint: Ctrl+K off a Mac.
export function initKeys() {
  const card = document.querySelector<HTMLDialogElement>('#keys');
  const toggle = document.querySelector<HTMLInputElement>('[data-keys-toggle]');
  const STORAGE = 'keys';
  const enabled = () => {
    try {
      return localStorage.getItem(STORAGE) !== 'off';
    } catch {
      return true;
    }
  };
  if (toggle) {
    toggle.checked = enabled();
    toggle.addEventListener('change', () => {
      try {
        localStorage.setItem(STORAGE, toggle.checked ? 'on' : 'off');
      } catch {}
    });
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pendingG: ReturnType<typeof setTimeout> | null = null;

  // A held key repeats, and smooth scrolling would lag behind it.
  const behavior = (instant = false): ScrollBehavior => (instant || reduced.matches ? 'instant' : 'smooth');
  const lines = (n: number) =>
    n * (parseFloat(getComputedStyle(document.querySelector('main') ?? document.body).lineHeight) || 24);

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || !enabled()) return;
    const target = e.target as Element | null;
    if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    if (document.querySelector('dialog[open]')) return;

    if (pendingG) {
      clearTimeout(pendingG);
      pendingG = null;
      if (e.key === 'g') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: behavior() });
        return;
      }
      if (e.key === 'h') {
        e.preventDefault();
        window.location.href = '/';
        return;
      }
    }
    switch (e.key) {
      case '/':
      case ':': {
        const palette = document.querySelector<HTMLDialogElement>('#palette');
        if (!palette) return;
        e.preventDefault();
        document.querySelector<HTMLElement>('[data-palette-open]')?.click();
        break;
      }
      case 'j':
      case 'k':
        e.preventDefault();
        window.scrollBy({ top: lines(e.key === 'j' ? 3 : -3), behavior: behavior(e.repeat) });
        break;
      case 'g':
        pendingG = setTimeout(() => {
          pendingG = null;
        }, 800);
        break;
      case 'G':
        e.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: behavior() });
        break;
      case 'z': {
        const reader = document.querySelector<HTMLButtonElement>('[data-reader-toggle]');
        if (!reader || !reader.offsetParent) return;
        e.preventDefault();
        reader.click();
        break;
      }
      case '?':
        if (!card) return;
        e.preventDefault();
        card.showModal();
        break;
    }
  });

  const kbd = document.querySelector('[data-kbd-trigger]');
  if (kbd) {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
      navigator.platform ??
      '';
    if (!/mac/i.test(platform)) kbd.textContent = 'Ctrl+K';
  }
}
