// The links a body makes to other pages, read off the Markdown: `[[wiki
// links]]` (outside code) and Markdown or HTML links to a site path.
import type { Page } from './types.ts';
import { resolveTitle, type TitleIndex } from './titles.ts';
import { pathOf } from './urls.ts';

/** Wiki link titles in a body, outside code (`\|` in a table cell keeps its backslash, as the parser sees it). */
export function wikiLinksIn(body: string): string[] {
  const text = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  return [...text.matchAll(/\[\[([^\]|\n]+?)(?:\|([^\]\n]+?))?\]\]/g)].map((m) => m[1]!.trim());
}

/** The site-relative links, images and embeds in a body, Markdown or HTML. */
export function localTargets(body: string): string[] {
  return [...body.matchAll(/\]\((\/(?!\/)[^)\s]*)|(?:href|src|data)="(\/(?!\/)[^"]*)"/g)].map((m) => m[1] ?? m[2]!);
}

/** The pages a body links to (wiki links by title, Markdown links by path), on this site. */
export function linkedPages(body: string, titles: TitleIndex, byUrl: Map<string, Page>): Page[] {
  const out: Page[] = [];
  for (const title of wikiLinksIn(body)) {
    const url = resolveTitle(titles, title);
    const page = url && !url.startsWith('http') ? byUrl.get(url) : undefined;
    if (page) out.push(page);
  }
  for (const m of body.matchAll(/\]\((\/[^)\s#?]*)/g)) {
    const page = byUrl.get(pathOf(m[1]!));
    if (page) out.push(page);
  }
  return out;
}
