// Reader mode: <html data-hide-explorer> and data-hide-rail hide the
// Explorer (from lg) and the rail (from xl) through the layout's classes.
// The header's one button (or z) puts away whichever of them is showing,
// or, when neither is, brings both back. The head script applies a stored choice
// before first paint; this keeps localStorage('hide-explorer' | 'hide-rail').
export function initPanels() {
  var root = document.documentElement;
  var button = document.querySelector('[data-reader-toggle]');
  if (!button) return;
  var wide = window.matchMedia('(min-width: 80rem)');
  // The panels this page has at this width.
  function panels() {
    var list = [];
    if (document.querySelector('[data-explorer]')) list.push('explorer');
    if (document.querySelector('[data-rail]') && wide.matches) list.push('rail');
    return list;
  }
  function reading() {
    return panels().every(function (panel) {
      return root.hasAttribute('data-hide-' + panel);
    });
  }
  // The status line names the mode: READER, unless search has taken it.
  var mode = document.querySelector('[data-status-mode]');
  function reflect() {
    var on = reading();
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!mode) return;
    mode.setAttribute('data-rest', on ? 'READER' : 'NORMAL');
    if (mode.textContent !== 'SEARCH') mode.textContent = mode.getAttribute('data-rest');
  }
  reflect();
  wide.addEventListener('change', reflect);
  button.addEventListener('click', function () {
    var hide = !reading();
    ['explorer', 'rail'].forEach(function (panel) {
      root.toggleAttribute('data-hide-' + panel, hide);
      try {
        localStorage.setItem('hide-' + panel, hide ? 'on' : 'off');
      } catch (e) {}
    });
    reflect();
  });
}
