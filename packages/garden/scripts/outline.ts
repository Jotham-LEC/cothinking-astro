// The outline's scroll spy (components/Outline.astro): the heading in view
// lights its link, in both copies of the outline. A heading activates once
// it scrolls under the sticky header (the page's scroll-padding-top); the
// last ones, which can never reach it, share the end of the scroll range.
const offset = () => (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 72) + 16;

/** The id of the heading in view: the last one past the trigger line, the unreachable last ones spread over the end. */
function activeHeading(ids: string[]): string | null {
  const doc = document.documentElement;
  const scrollY = window.scrollY;
  const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
  const heads = ids.flatMap((id) => {
    const el = document.getElementById(id);
    return el ? [{ id, y: el.getBoundingClientRect().top + scrollY }] : [];
  });
  if (!heads.length) return null;
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
  return active;
}

/** The outline's links (both copies), by the heading id they point at, and the frame a scroll has asked for. */
type Outline = { links: HTMLAnchorElement[]; byId: Map<string, HTMLAnchorElement[]>; frame: number | null };

function update(o: Outline) {
  const ids = [...o.byId.keys()];
  if (!ids.some((id) => document.getElementById(id))) return;
  const active = activeHeading(ids);
  for (const l of o.links) {
    l.classList.remove('is-active');
    l.removeAttribute('aria-current');
  }
  for (const l of (active && o.byId.get(active)) || []) {
    l.classList.add('is-active');
    l.setAttribute('aria-current', 'true');
  }
}

function schedule(o: Outline) {
  o.frame ??= requestAnimationFrame(() => {
    o.frame = null;
    update(o);
  });
}

export function initOutline() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc] a')];
  if (!links.length) return;
  const byId = new Map<string, HTMLAnchorElement[]>();
  for (const link of links) {
    const id = link.getAttribute('href')!.slice(1);
    byId.set(id, [...(byId.get(id) ?? []), link]);
  }
  const o: Outline = { links, byId, frame: null };
  window.addEventListener('scroll', () => schedule(o), { passive: true });
  window.addEventListener('resize', () => schedule(o));
  update(o);
}
