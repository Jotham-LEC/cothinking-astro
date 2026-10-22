/*! Adapted from Laradocs (https://github.com/petebishwhip/laradocs), Copyright (c) Pete Bishop, MIT License: see LICENSE-laradocs.md */
// The theme toggle (components/Header.astro). Two states, light and dark,
// seeded from the scheme in effect, so the first click always changes
// something. Only a choice that differs from the OS is stored: clicking back
// to the OS's scheme forgets it, and the site follows the OS again. The
// layout's head script has already applied a stored choice before first
// paint; CSS (styles/shell.css) picks the icon.
const STORAGE_KEY = 'theme';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function storedTheme(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

const systemTheme = () => (systemDark.matches ? 'dark' : 'light');

/** The scheme in effect: the stored choice, else the OS's. */
function currentTheme(): 'light' | 'dark' {
  const stored = storedTheme();
  return stored === 'light' || stored === 'dark' ? stored : systemTheme();
}

export function initTheme() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!toggle) return;
  const reflect = () => {
    toggle.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };
  reflect();
  systemDark.addEventListener('change', reflect);
  toggle.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    const followsSystem = next === systemTheme();
    try {
      if (followsSystem) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    if (followsSystem) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    reflect();
  });
}
