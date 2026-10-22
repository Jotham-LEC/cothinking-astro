// Explorer folders: the chevron toggles a folder, and the browser remembers
// which ones you opened or closed (the server opens the current page's).
// Scroll position comes back too, so the tree does not jump between pages.
export function initExplorer() {
  var explorer = document.querySelector('[data-explorer]');
  if (!explorer) return;
  var STATE_KEY = 'explorer';
  var SCROLL_KEY = 'explorer-scroll';
  var state = {};
  try {
    state = JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {};
  } catch (e) {}

  explorer.querySelectorAll('li[data-path]').forEach(function (li) {
    var button = li.querySelector(':scope > div > button');
    if (!button) return;
    var path = li.getAttribute('data-path');
    var holdsCurrent = !!li.querySelector('[aria-current]');
    // A remembered choice wins, except that the current page's folder is always open.
    if (!holdsCurrent && typeof state[path] === 'boolean') {
      li.classList.toggle('is-collapsed', state[path]);
    }
    button.setAttribute('aria-expanded', li.classList.contains('is-collapsed') ? 'false' : 'true');
    button.addEventListener('click', function () {
      var collapsed = li.classList.toggle('is-collapsed');
      button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      state[path] = collapsed;
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
      } catch (e) {}
    });
  });

  try {
    // The tree scrolls inside the column, which only frames it.
    var scroller = explorer.querySelector('[data-explorer-scroll]') || explorer;
    var saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) scroller.scrollTop = parseInt(saved, 10) || 0;
    scroller.addEventListener(
      'scroll',
      function () {
        sessionStorage.setItem(SCROLL_KEY, String(scroller.scrollTop));
      },
      { passive: true },
    );
  } catch (e) {}
}
