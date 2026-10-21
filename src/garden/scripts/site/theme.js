var STORAGE_KEY = 'theme';

function applyTheme(theme) {
  var root = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }
}

function storedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function systemTheme() {
  return systemDark.matches ? 'dark' : 'light';
}

// The scheme in effect: the stored choice, else the OS's.
function currentTheme() {
  var stored = storedTheme();
  if (stored === 'light' || stored === 'dark') return stored;
  return systemTheme();
}

// Two states, light and dark, seeded from the scheme in effect, so the first
// click always changes something. Only a choice that differs from the OS is
// stored: clicking back to the OS's scheme forgets it, and the site follows
// the OS again. The head script has already applied a stored choice before
// first paint.
export function initTheme() {
  var toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) return;
  function reflect() {
    var theme = currentTheme();
    toggle.setAttribute('data-theme-state', theme);
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  reflect();
  systemDark.addEventListener('change', reflect);
  toggle.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    var followsSystem = next === systemTheme();
    try {
      if (followsSystem) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    applyTheme(followsSystem ? null : next);
    reflect();
  });
}
