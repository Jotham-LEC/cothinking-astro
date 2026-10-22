// The outline's scroll spy (components/Outline.astro): the heading in view
// lights its link, in both copies of the outline. A heading activates once
// it scrolls under the sticky header (the page's scroll-padding-top); the
// last ones, which can never reach it, share the end of the scroll range.
export function initOutline() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc] a')];
  if (!links.length) return;
  const byId = new Map<string, HTMLAnchorElement[]>();
  for (const link of links) {
    const id = link.getAttribute('href')!.slice(1);
    byId.set(id, [...(byId.get(id) ?? []), link]);
  }
  const ids = [...byId.keys()];
  const offset = () => (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 72) + 16;

  function update() {
    const doc = document.documentElement;
    const scrollY = window.scrollY;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const heads = ids.flatMap((id) => {
      const el = document.getElementById(id);
      return el ? [{ id, y: el.getBoundingClientRect().top + scrollY }] : [];
    });
    if (!heads.length) return;
    const trigger = offset();
    const activations = heads.map((h) => Math.max(0, h.y - trigger));
    const firstUnreachable = activations.findIndex((a) => a > maxScroll);
    if (firstUnreachable >= 0) {
      const start = firstUnreachable === 0 ? 0 : activations[firstUnreachable - 1]!;
      const n = heads.length - firstUnreachable;
      const step = Math.max(1, (maxScroll - start) / n);
      for (let j = 0; j < n; j++) activations[firstUnreachable + j] = start + step * (j + 1);
    }
    let active: string | null = null;
    for (let i = 0; i < heads.length; i++) {
      if (activations[i]! <= scrollY) active = heads[i]!.id;
      else break;
    }
    for (const l of links) {
      l.classList.remove('is-active');
      l.removeAttribute('aria-current');
    }
    for (const l of (active && byId.get(active)) || []) {
      l.classList.add('is-active');
      l.setAttribute('aria-current', 'true');
    }
  }

  let frame: number | null = null;
  const schedule = () => {
    frame ??= requestAnimationFrame(() => {
      frame = null;
      update();
    });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}
