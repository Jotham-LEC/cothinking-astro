// The `feed` parser: the same Markdown without anchors, external-link marks,
// callouts or image touches, for RSS items and plain excerpts. `breaks` turns
// single line breaks into <br> (a quote note's quote).
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import type { TitleIndex } from '../titles.ts';
import { wikiLinkSyntax } from './index.ts';
import rehypeCallouts from './rehype-callouts.ts';
import remarkWikiLinks from './remark-wiki-links.ts';

export function feedProcessor(titles: TitleIndex, { breaks = false, callouts = false } = {}) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(wikiLinkSyntax()).use(remarkWikiLinks, { titles });
  if (breaks) processor.use(remarkBreaks);
  const html = processor.use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw);
  // `callouts` renders `> [!NOTE]` as the page does, so a description's first paragraph is the callout's text, not its marker.
  if (callouts) html.use(rehypeCallouts);
  return html.use(rehypeStringify);
}

export async function renderFeed(
  markdown: string,
  titles: TitleIndex,
  options: { breaks?: boolean; callouts?: boolean } = {},
): Promise<string> {
  return String(await feedProcessor(titles, options).process(markdown));
}

/** Site-relative `href`/`src` made absolute (Statamic's `full_urls` modifier). */
export function fullUrls(html: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return html.replace(/(href|src)="\/(?!\/)/g, `$1="${base}/`);
}

/** Plain text from HTML: tags gone, entities decoded, whitespace squished. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
      const named: Record<string, string> = {
        amp: '&',
        lt: '<',
        gt: '>',
        quot: '"',
        apos: "'",
        nbsp: ' ',
        hellip: '…',
        mdash: '—',
        ndash: '–',
        rsquo: '’',
        lsquo: '‘',
        rdquo: '”',
        ldquo: '“',
      };
      if (code[0] === '#')
        return String.fromCodePoint(
          code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10),
        );
      return named[code.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}
