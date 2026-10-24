// Resolves the `[[Title]]` and `[[Title|text]]` nodes remark-wiki-link parsed
// against the title index: a page → `<a class="wiki-link" href>` (a page on
// the other site by its full address, marked external too), a missing or
// draft one → `<span class="wiki-link-missing" data-title>`. In a table cell
// the pipe is written `\|`, which leaves a backslash on the title. `index`
// is read on each run, so `astro dev` sees a renamed page without a restart.
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { resolveTitle, type LinkIndex } from '../titles.ts';
import { isExternal } from '../site.ts';

type WikiLinkNode = {
  type: 'wikiLink';
  value: string;
  data: { alias?: string | null; hName?: string; hProperties?: Record<string, unknown>; hChildren?: unknown[] };
};

export default function remarkWikiLinks({ index: indexOf, siteUrl }: { index: () => LinkIndex; siteUrl?: string }) {
  return (tree: Root) => {
    const index = indexOf();
    visit(tree as unknown as import('unist').Node, 'wikiLink', (node: unknown) => {
      const link = node as WikiLinkNode;
      const title = link.value.replace(/\\$/, '').trim();
      const text = (link.data.alias ?? title).trim();
      const url = resolveTitle(index, title);
      link.data.hName = url ? 'a' : 'span';
      link.data.hProperties = url
        ? { className: siteUrl && isExternal(url, siteUrl) ? ['wiki-link', 'external-link'] : ['wiki-link'], href: url }
        : { className: ['wiki-link-missing'], dataTitle: title };
      link.data.hChildren = [{ type: 'text', value: text }];
    });
  };
}
