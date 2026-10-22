// A heading is a link to itself (`.anchor`, lib/markdown/rehype-heading-anchors.ts):
// following it also copies its address, confirmed for a moment beside it and
// read out. Where the clipboard is not available, it is an ordinary link.
export function initHeadingLinks() {
  if (!navigator.clipboard || document.querySelector('[data-heading-links]')) return;
  const status = document.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('data-heading-links', '');
  document.body.appendChild(status);
  document.addEventListener('click', (e) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('a.anchor[href^="#"]');
    if (!link) return;
    navigator.clipboard.writeText(new URL(link.getAttribute('href')!, location.href).href).then(
      () => {
        link.setAttribute('data-copied', '');
        status.textContent = 'Link copied';
        setTimeout(() => {
          link.removeAttribute('data-copied');
          status.textContent = '';
        }, 1500);
      },
      () => {},
    );
  });
}
