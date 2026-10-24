// The links a body makes to other pages, read off the Markdown as the renderer
// parses it (remark-parse, GFM, remark-wiki-link): `[[wiki links]]`, links to
// a page's file (`[text](../essays/x.md)`) and Markdown links to a site path. Code, escaped brackets and raw HTML blocks
// hold no links, exactly as on the page. Raw HTML tags are searched for their
// `href`, `src` and `data` paths.
import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import type { SiteEntry } from './entry.ts';
import { wikiLinkSyntax } from './markdown/index.ts';
import { pathOf } from './site.ts';
import { fileTarget, isFileLink, resolveFile, resolveTitle, type LinkIndex } from './titles.ts';

const parser = unified().use(remarkParse).use(remarkGfm).use(wikiLinkSyntax());

type Found = { wikiLinks: string[]; files: string[]; paths: string[]; htmlPaths: string[] };

function linksIn(body: string): Found {
  const tree = parser.parse(body) as Root;
  const found: Found = { wikiLinks: [], files: [], paths: [], htmlPaths: [] };
  const local = (url: string) => url.startsWith('/') && !url.startsWith('//');
  visit(tree, (node) => {
    if ((node.type as string) === 'wikiLink') found.wikiLinks.push(String((node as { value?: unknown }).value).trim());
    else if ((node.type === 'link' || node.type === 'definition') && isFileLink(node.url)) found.files.push(node.url);
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

/** Links to a page's file in a body (`../essays/x.md#part`), as written. */
export function fileLinksIn(body: string): string[] {
  return linksIn(body).files;
}

/** The file a page's relative links are read from: `src/content/<collection>/<id>.md` in its site's folder. */
export const fileOf = (entry: { collection: string; id: string }): string =>
  `src/content/${entry.collection}/${entry.id}.md`;

/** The site-relative links, images and embeds in a body, Markdown or HTML. */
export function localTargets(body: string): string[] {
  const { paths, htmlPaths } = linksIn(body);
  return [...paths, ...htmlPaths];
}

/** The level of a body's first Markdown heading (`##` is 2), or null when it has none. */
export function firstHeadingDepth(body: string): number | null {
  let depth: number | null = null;
  visit(parser.parse(body) as Root, 'heading', (node) => {
    depth ??= node.depth;
  });
  return depth;
}

/** The pages an entry's body links to (wiki links by title, file links by file, Markdown links by path), on this site. */
export function linkedPages(entry: SiteEntry, index: LinkIndex, byUrl: Map<string, SiteEntry>): SiteEntry[] {
  const { wikiLinks, files, paths } = linksIn(entry.body);
  const out: SiteEntry[] = [];
  for (const title of wikiLinks) {
    const url = resolveTitle(index, title);
    const page = url && !url.startsWith('http') ? byUrl.get(url) : undefined;
    if (page) out.push(page);
  }
  for (const link of files) {
    const target = fileTarget(index, fileOf(entry), link);
    const url = target.site === 'own' ? resolveFile(index, { ...target, hash: '' }) : null;
    const page = url ? byUrl.get(url) : undefined;
    if (page) out.push(page);
  }
  for (const url of paths) {
    const page = byUrl.get(pathOf(url));
    if (page) out.push(page);
  }
  return out;
}
