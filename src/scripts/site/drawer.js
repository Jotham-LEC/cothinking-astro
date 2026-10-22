// The Explorer is a drawer below the lg breakpoint; `nav-open` on <body>
// slides it in.
// A closed drawer is only moved off-screen, so it is also made inert: its
// links leave the tab order and the screen reader's reading order. An open
// one makes the page behind it inert instead, like a dialog, and closes
// from its own button since it covers the menu button. Returns its close(),
// for the search palette to put it away.
export function initDrawer() {
  var button = document.querySelector('[data-menu]');
  var explorer = document.querySelector('[data-explorer]');
  var backdrop = document.querySelector('[data-backdrop]');
  var closeButton = explorer && explorer.querySelector('[data-menu-close]');
  if (!button || !explorer) return;
  var behind = Array.prototype.filter
    .call(document.body.children, function (el) {
      return el !== explorer && !el.contains(explorer) && el.tagName !== 'SCRIPT';
    })
    .concat(
      Array.prototype.filter.call(explorer.parentNode.children, function (el) {
        return el !== explorer && el !== backdrop;
      }),
    );
  var desktop = window.matchMedia('(min-width: 64rem)');
  function isOpen() {
    return document.body.classList.contains('nav-open');
  }
  function reflect() {
    button.setAttribute('aria-expanded', isOpen() ? 'true' : 'false');
    explorer.inert = !isOpen() && !desktop.matches;
    behind.forEach(function (el) {
      el.inert = isOpen();
    });
    // Open as a drawer, it is a modal dialog: say so.
    if (isOpen()) {
      explorer.setAttribute('role', 'dialog');
      explorer.setAttribute('aria-modal', 'true');
      explorer.setAttribute('aria-label', 'Site navigation');
    } else {
      ['role', 'aria-modal', 'aria-label'].forEach(function (name) {
        explorer.removeAttribute(name);
      });
    }
  }
  function open() {
    document.body.classList.add('nav-open');
    reflect();
    var current = explorer.querySelector('[aria-current]') || explorer.querySelector('a, button');
    if (current) current.focus();
  }
  // Focus goes back to the menu button, unless a link is taking the reader away.
  function close(returnFocus) {
    if (!isOpen()) return;
    document.body.classList.remove('nav-open');
    reflect();
    if (returnFocus) button.focus();
  }
  reflect();
  desktop.addEventListener('change', function () {
    if (desktop.matches) close(false);
    reflect();
  });
  button.addEventListener('click', function () {
    if (isOpen()) close(true);
    else open();
  });
  if (backdrop)
    backdrop.addEventListener('click', function () {
      close(true);
    });
  if (closeButton)
    closeButton.addEventListener('click', function () {
      close(true);
    });
  explorer.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      close(false);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close(true);
  });
  return close;
}
