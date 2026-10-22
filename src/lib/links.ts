// The links a body makes to other pages, read off the Markdown as the renderer
// parses it (remark-parse, GFM, remark-wiki-link): `[[wiki links]]` and
// Markdown links to a site path. Code, escaped brackets and raw HTML blocks
// hold no links, exactly as on the page. Raw HTML tags are searched for their
// `href`, `src` and `data` paths.
import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { wikiLinkSyntax } from './markdown/index.ts';
import type { Page } from './types.ts';
import { resolveTitle, type TitleIndex } from './titles.ts';
import { pathOf } from './urls.ts';

const parser = unified().use(remarkParse).use(remarkGfm).use(wikiLinkSyntax());

type Found = { wikiLinks: string[]; paths: string[]; htmlPaths: string[] };

function linksIn(body: string): Found {
  const tree = parser.parse(body) as Root;
  const found: Found = { wikiLinks: [], paths: [], htmlPaths: [] };
  const local = (url: string) => url.startsWith('/') && !url.startsWith('//');
  visit(tree, (node) => {
    if ((node.type as string) === 'wikiLink') found.wikiLinks.push(String((node as { value?: unknown }).value).trim());
    else if ((node.type === 'link' || node.type === 'image' || node.type === 'definition') && local(node.url))
      found.paths.push(node.url);
    else if (node.type === 'html')
      for (const m of node.value.matchAll(/(?:href|src|data)="(\/(?!\/)[^"]*)"/g)) found.htmlPaths.push(m[1]!);
  });
  return found;
}

/** Wiki link titles in a body (`\|` in a table cell keeps its backslash, as the parser sees it). */
export function wikiLinksIn(body: string): string[] {
  return linksIn(body).wikiLinks;
}

/** The site-relative links, images and embeds in a body, Markdown or HTML. */
export function localTargets(body: string): string[] {
  const { paths, htmlPaths } = linksIn(body);
  return [...paths, ...htmlPaths];
}

/** The pages a body links to (wiki links by title, Markdown links by path), on this site. */
export function linkedPages(body: string, titles: TitleIndex, byUrl: Map<string, Page>): Page[] {
  const { wikiLinks, paths } = linksIn(body);
  const out: Page[] = [];
  for (const title of wikiLinks) {
    const url = resolveTitle(titles, title);
    const page = url && !url.startsWith('http') ? byUrl.get(url) : undefined;
    if (page) out.push(page);
  }
  for (const url of paths) {
    const page = byUrl.get(pathOf(url));
    if (page) out.push(page);
  }
  return out;
}
