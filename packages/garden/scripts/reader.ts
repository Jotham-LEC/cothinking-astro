// Reader mode (components/Header.astro's button, or `z`): <html
// data-hide-explorer data-hide-rail> puts the Explorer (from lg) and the
// rail (from xl) away through styles/shell.css; the button is pressed while
// they are. The layout's head script applies the stored choice before first
// paint; this keeps localStorage('hide-explorer' | 'hide-rail').
export function initReader() {
  const root = document.documentElement;
  const button = document.querySelector<HTMLButtonElement>('[data-reader-toggle]');
  if (!button) return;
  const reflect = () => button.setAttribute('aria-pressed', root.hasAttribute('data-hide-explorer') ? 'true' : 'false');
  reflect();
  button.addEventListener('click', () => {
    const hide = !root.hasAttribute('data-hide-explorer');
    for (const panel of ['explorer', 'rail']) {
      root.toggleAttribute(`data-hide-${panel}`, hide);
      try {
        localStorage.setItem(`hide-${panel}`, hide ? 'on' : 'off');
      } catch {}
    }
    reflect();
  });
}
