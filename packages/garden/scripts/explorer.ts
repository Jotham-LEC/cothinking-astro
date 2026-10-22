// The Explorer (components/Explorer.astro, inside the drawer
// components/Drawer.astro): the chevron toggles a folder, and the browser
// remembers which ones you opened or closed (the server opens the current
// page's). Scroll position comes back too, so the tree does not jump between
// pages. When the drawer opens, focus goes to the current page's link and
// the page behind it (the main column, the rail, the footer) is inert until
// it closes, as a popover is not modal; when the window grows into the
// column layout, an open drawer is put away.
export function initExplorer() {
  const explorer = document.getElementById('explorer');
  if (!explorer) return;
  const STATE_KEY = 'explorer';
  const SCROLL_KEY = 'explorer-scroll';
  let state: Record<string, boolean> = {};
  try {
    state = JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {};
  } catch {}

  for (const li of explorer.querySelectorAll<HTMLElement>('li[data-path]')) {
    const button = li.querySelector<HTMLButtonElement>(':scope > div > button');
    if (!button) continue;
    const path = li.dataset.path!;
    const holdsCurrent = li.querySelector('[aria-current]') !== null;
    // A remembered choice wins, except that the current page's folder is always open.
    if (!holdsCurrent && typeof state[path] === 'boolean') li.classList.toggle('is-collapsed', state[path]);
    button.setAttribute('aria-expanded', li.classList.contains('is-collapsed') ? 'false' : 'true');
    button.addEventListener('click', () => {
      const collapsed = li.classList.toggle('is-collapsed');
      button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      state[path] = collapsed;
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
      } catch {}
    });
  }

  // The tree scrolls inside the column, which only frames it.
  const scroller = explorer.querySelector<HTMLElement>('[data-explorer-scroll]') ?? explorer;
  try {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) scroller.scrollTop = parseInt(saved, 10) || 0;
  } catch {}
  scroller.addEventListener(
    'scroll',
    () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(scroller.scrollTop));
      } catch {}
    },
    { passive: true },
  );

  const column = window.matchMedia('(min-width: 64rem)');
  const room = explorer.closest('[data-room]') !== null;
  const behind = [
    document.getElementById('main')?.closest('.shell > *'),
    document.getElementById('rail'),
    document.querySelector('body > footer'),
  ].filter((el): el is HTMLElement => el instanceof HTMLElement);
  explorer.addEventListener('toggle', (event) => {
    const opened = (event as ToggleEvent).newState === 'open';
    // From lg outside a room the Explorer is a column, not a drawer over the page.
    for (const el of behind) el.inert = opened && (room || !column.matches);
    if (!opened) return;
    const current =
      explorer.querySelector<HTMLElement>('[aria-current]') ?? explorer.querySelector<HTMLElement>('a, button');
    current?.focus();
  });
  column.addEventListener('change', () => {
    if (column.matches && !room && explorer.matches(':popover-open')) explorer.hidePopover();
  });
}
