// A page as Markdown (routes/[...uri].md.ts, for a collection with
// `markdown`): its title and description, then its body as written, with
// every link made a full address so the copy reads anywhere. `[[wiki links]]`
// and links to a page's file resolve against the link index as on the page
// (one to no published page keeps its text); a site path gets the site's
// address, so do raw HTML's `href` and `src`; an image Astro optimised takes
// the address the page draws it from (`images`, in order). The content
// components' fences (`:::tabs`, `:::cards`, `:::steps`) go, keeping what
// they hold, and a tab's `::tab[Label]` becomes its label in bold.
import type { Node } from 'unist';
import { toString } from 'mdast-util-to-string';
import { SKIP, visit } from 'unist-util-visit';
import { descriptionOf, type SiteEntry } from './entry.ts';
import { fileOf, parseBody } from './links.ts';
import { fileTarget, isFileLink, resolveFile, resolveTitle, type LinkIndex } from './linkIndex.ts';
import { absolute, type SiteConfig } from './site.ts';

type Edit = { start: number; end: number; text: string };

const isSitePath = (url: string) => url.startsWith('/') && !url.startsWith('//');
/** The line around an offset, with its newline. */
function lineAt(body: string, offset: number): { start: number; end: number } {
  const end = body.indexOf('\n', offset);
  return { start: body.lastIndexOf('\n', offset - 1) + 1, end: end < 0 ? body.length : end + 1 };
}

const isRelative = (url: string) => !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('/') && !url.startsWith('#');

export function markdownCopy(
  page: SiteEntry,
  { index, site, images }: { index: LinkIndex; site: SiteConfig; images: string[] },
): string {
  const body = page.body;
  const full = (url: string) => (isSitePath(url) ? absolute(site.url, url) : url);
  const edits: Edit[] = [];
  const at = (node: Node) => ({ start: node.position!.start.offset!, end: node.position!.end.offset! });
  const replace = (node: Node, text: string) => edits.push({ ...at(node), text });
  // A link's own marks, so the edits to what it holds (an image) stay apart: `[` and `](url "title")`.
  const relink = (link: Node & { children: Node[] }, url: string | null) => {
    const { start, end } = at(link);
    const textEnd = link.children.length ? at(link.children.at(-1)!).end : start + 1;
    if (!url) edits.push({ start, end: start + 1, text: '' });
    edits.push({ start: textEnd, end, text: url ? `](${full(url)})` : '' });
  };
  let image = 0;

  visit(parseBody(body), (node, _, parent) => {
    if (!node.position) return;
    // A fence's `[label]` is on its opening line, which goes.
    if ((node.data as { directiveLabel?: boolean } | undefined)?.directiveLabel) return SKIP;
    switch (node.type as string) {
      case 'containerDirective': {
        const opening = lineAt(body, at(node).start);
        const closing = lineAt(body, at(node).end - 1);
        edits.push({ ...opening, text: '' });
        if (closing.start > opening.start && /^\s*:{3,}\s*$/.test(body.slice(closing.start, closing.end)))
          edits.push({ ...closing, text: '' });
        break;
      }
      case 'leafDirective': {
        const directive = node as Node & { name: string };
        const inTabs = (parent as { name?: string } | undefined)?.name === 'tabs';
        if (directive.name !== 'tab' || !inTabs) break;
        const line = lineAt(body, at(node).start).start;
        const indent = body.slice(line, at(node).start);
        edits.push({ start: line, end: at(node).end, text: `\n${indent}**${toString(node)}**\n` });
        break;
      }
      case 'wikiLink': {
        const link = node as unknown as { value: string; data: { alias?: string | null } };
        const title = link.value.replace(/\\$/, '').trim();
        const url = resolveTitle(index, title);
        const text = (link.data.alias ?? title).trim();
        replace(node, url ? `[${text}](${full(url)})` : text);
        break;
      }
      case 'link': {
        const link = node as Node & { url: string; children: Node[] };
        if (isFileLink(link.url)) relink(link, resolveFile(index, fileTarget(index, fileOf(page), link.url)));
        else if (isSitePath(link.url)) relink(link, link.url);
        break;
      }
      case 'definition': {
        const definition = node as Node & { url: string; label?: string | null };
        const url = isFileLink(definition.url)
          ? resolveFile(index, fileTarget(index, fileOf(page), definition.url))
          : definition.url;
        if (url && (url !== definition.url || isSitePath(url))) replace(node, `[${definition.label}]: ${full(url)}`);
        break;
      }
      case 'image': {
        const img = node as Node & { url: string; alt?: string | null };
        const url = isSitePath(img.url) ? img.url : isRelative(img.url) ? images[image++] : null;
        if (url) replace(node, `![${img.alt ?? ''}](${full(url)})`);
        break;
      }
      case 'html':
        replace(
          node,
          body
            .slice(at(node).start, at(node).end)
            .replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_, name, url) => `${name}="${full(url)}"`),
        );
        break;
    }
  });

  let out = body;
  for (const { start, end, text } of edits.sort((a, b) => b.start - a.start))
    out = out.slice(0, start) + text + out.slice(end);
  const description = descriptionOf(page);
  return [`# ${page.title}`, ...(description ? [`> ${description}`] : []), out.trim()].join('\n\n') + '\n';
}
