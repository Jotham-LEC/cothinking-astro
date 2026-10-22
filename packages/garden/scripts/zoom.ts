// An image in the text (components/Prose.astro), unless it is a link, is a
// button: a click, Enter or Space enlarges it, again or Escape puts it back
// (`.zoomable`, styles/components.css).
export function initZoom() {
  for (const img of document.querySelectorAll<HTMLImageElement>('.prose :not(a) > img')) {
    img.classList.add('zoomable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-pressed', 'false');
    img.setAttribute('aria-label', `Enlarge image${img.alt ? `: ${img.alt}` : ''}`);
    const toggle = (zoomed: boolean) => {
      img.classList.toggle('is-zoomed', zoomed);
      img.setAttribute('aria-pressed', zoomed ? 'true' : 'false');
    };
    img.addEventListener('click', () => toggle(!img.classList.contains('is-zoomed')));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(!img.classList.contains('is-zoomed'));
      }
      if (e.key === 'Escape' && img.classList.contains('is-zoomed')) {
        e.stopPropagation();
        toggle(false);
      }
    });
  }
}
