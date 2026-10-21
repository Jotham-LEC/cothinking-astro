// The outline: h2 and h3 headings with ids, from Astro's `headings` plus any a
// view adds; empty unless there are at least two.
export type Heading = { depth: number; slug: string; text: string };
export type TocEntry = { level: number; id: string; text: string };

export function toc(headings: Heading[], extra: TocEntry[] = []): TocEntry[] {
  const own = headings
    .filter((h) => (h.depth === 2 || h.depth === 3) && h.slug !== '')
    .map((h) => ({ level: h.depth, id: h.slug, text: h.text.replace(/\s+/g, ' ').trim() }));
  const all = [...own, ...extra];
  return all.length >= 2 ? all : [];
}
