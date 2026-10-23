/*! Adapted from Laradocs (https://github.com/petebishwhip/laradocs), Copyright (c) Pete Bishop, MIT License: see LICENSE-laradocs.md */
// Vim-style keys (the card is components/Keys.astro): / or : searches, j
// and k scroll, g g and G go to the top and bottom, g h goes home, z toggles
// reader mode, ? opens the card that lists them. They are ignored while
// typing, with a modifier held, or while a dialog is open, and the card's
// checkbox turns them all off (⌘K stays), remembered in localStorage('keys').
// Also the search button's hint: Ctrl+K off a Mac.
const STORAGE = 'keys';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Whether the keys are on (the card's checkbox); on when localStorage cannot be read. */
function enabled(): boolean {
  try {
    return localStorage.getItem(STORAGE) !== 'off';
  } catch {
    return true;
  }
}

/** A held key repeats, and smooth scrolling would lag behind it. */
const behavior = (instant = false): ScrollBehavior => (instant || reduced() ? 'instant' : 'smooth');
const lines = (n: number) =>
  n * (parseFloat(getComputedStyle(document.querySelector('main') ?? document.body).lineHeight) || 24);

/** Typing, a modifier, an earlier handler, the keys turned off, or an open dialog: the key is not ours. */
function ignored(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || !enabled()) return true;
  const target = e.target as Element | null;
  if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return true;
  return document.querySelector('dialog[open]') !== null;
}

/** What the keys remember: the card, and a g waiting for its second key. */
type Keys = { card: HTMLDialogElement | null; pendingG: ReturnType<typeof setTimeout> | null };

/** The second key after g: g goes to the top, h goes home. Returns whether it was one. */
function afterG(s: Keys, e: KeyboardEvent): boolean {
  if (!s.pendingG) return false;
  clearTimeout(s.pendingG);
  s.pendingG = null;
  if (e.key === 'g') {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: behavior() });
    return true;
  }
  if (e.key === 'h') {
    e.preventDefault();
    window.location.href = '/';
    return true;
  }
  return false;
}

function onKey(s: Keys, e: KeyboardEvent) {
  if (ignored(e) || afterG(s, e)) return;
  switch (e.key) {
    case '/':
    case ':': {
      if (!document.querySelector('#palette')) return;
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
      s.pendingG = setTimeout(() => {
        s.pendingG = null;
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
      if (!s.card) return;
      e.preventDefault();
      s.card.showModal();
      break;
  }
}

/** The search button's hint says Ctrl+K off a Mac. */
function platformHint() {
  const kbd = document.querySelector('[data-kbd-trigger]');
  if (!kbd) return;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    '';
  if (!/mac/i.test(platform)) kbd.textContent = 'Ctrl+K';
}

export function initKeys() {
  const toggle = document.querySelector<HTMLInputElement>('[data-keys-toggle]');
  if (toggle) {
    toggle.checked = enabled();
    toggle.addEventListener('change', () => {
      try {
        localStorage.setItem(STORAGE, toggle.checked ? 'on' : 'off');
      } catch {}
    });
  }
  const s: Keys = { card: document.querySelector<HTMLDialogElement>('#keys'), pendingG: null };
  document.addEventListener('keydown', (e) => onKey(s, e));
  platformHint();
}
