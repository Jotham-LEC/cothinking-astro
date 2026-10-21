// Vim-style keys: / or : searches, j and k scroll, g g and G go to the top
// and bottom, g h goes home, z toggles reader mode, ? opens the card that
// lists them. They are
// ignored while typing or with a modifier held, and the card's checkbox
// turns them all off (⌘K stays), remembered in localStorage('keys').
export function initKeys(openPalette) {
  var card = document.querySelector('[data-keys]');
  var toggle = document.querySelector('[data-keys-toggle]');
  var palette = document.querySelector('[data-palette]');
  var STORAGE = 'keys';
  function enabled() {
    try {
      return localStorage.getItem(STORAGE) !== 'off';
    } catch (e) {
      return true;
    }
  }
  if (toggle) {
    toggle.checked = enabled();
    toggle.addEventListener('change', function () {
      try {
        localStorage.setItem(STORAGE, toggle.checked ? 'on' : 'off');
      } catch (e) {}
    });
  }
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pendingG = null;

  // A held key repeats, and smooth scrolling would lag behind it.
  function behavior(instant) {
    return instant || reduced.matches ? 'instant' : 'smooth';
  }
  function lines(n) {
    var main = document.querySelector('main') || document.body;
    return n * (parseFloat(getComputedStyle(main).lineHeight) || 24);
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || !enabled()) return;
    if (
      e.target.closest &&
      e.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
    )
      return;
    if ((card && card.open) || (palette && !palette.hasAttribute('hidden'))) return;

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
      case ':':
        if (!openPalette) return;
        e.preventDefault();
        openPalette();
        break;
      case 'j':
      case 'k':
        e.preventDefault();
        window.scrollBy({ top: lines(e.key === 'j' ? 3 : -3), behavior: behavior(e.repeat) });
        break;
      case 'g':
        pendingG = setTimeout(function () {
          pendingG = null;
        }, 800);
        break;
      case 'G':
        e.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: behavior() });
        break;
      case 'z':
        var reader = document.querySelector('[data-reader-toggle]');
        if (!reader || !reader.offsetParent) return;
        e.preventDefault();
        reader.click();
        break;
      case '?':
        if (!card) return;
        e.preventDefault();
        card.showModal();
        break;
    }
  });
}

export function initSearchKbdHint() {
  var kbd = document.querySelector('[data-kbd-trigger]');
  if (!kbd) return;
  try {
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    if (!/mac/i.test(p)) kbd.textContent = 'Ctrl+K';
  } catch (e) {}
}
