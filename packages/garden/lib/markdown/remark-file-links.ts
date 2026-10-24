// Resolves Markdown links to another page's file, `[text](../essays/x.md)`
// (the link Emacs's markdown-mode follows), against the link index: a page
// → `<a class="wiki-link" href>` (a page on the other site, reached as
// `../../../../<folder>/src/content/…`, by its full address, marked external
// too), a missing or draft one → `<span class="wiki-link-missing"
// data-title>`, as a `[[wiki link]]` would be. A `#fragment` is kept. The
// path is read from the page's own file (`file.path`, relative to the site's
// folder `root`); `index` is read on each run, so `astro dev` sees a new page
// without a restart.
import path from 'node:path';
import type { Link, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { isExternal } from '../site.ts';
import { fileTarget, isFileLink, resolveFile, type LinkIndex } from '../titles.ts';

type Options = { index: () => LinkIndex; siteUrl?: string; root: string };

export default function remarkFileLinks({ index: indexOf, siteUrl, root }: Options) {
  return (tree: Root, file: VFile) => {
    if (!file.path) return;
    const index = indexOf();
    const from = path.relative(root, file.path).split(path.sep).join('/');
    visit(tree, 'link', (node: Link, at, parent) => {
      if (!isFileLink(node.url) || !parent || at === undefined) return;
      const url = resolveFile(index, fileTarget(index, from, node.url));
      if (url) {
        node.url = url;
        const className = siteUrl && isExternal(url, siteUrl) ? ['wiki-link', 'external-link'] : ['wiki-link'];
        // `hProperties` is what remark-rehype adds to the <a> (mdast-util-to-hast's data fields).
        const data = (node.data ?? {}) as { hProperties?: Record<string, unknown> };
        node.data = { ...data, hProperties: { ...data.hProperties, className } } as Link['data'];
        return;
      }
      // No page: a span in its place, its text kept (mdast-util-to-hast renders a node it does not know by its data).
      parent.children[at] = {
        type: 'fileLinkMissing',
        children: node.children,
        data: { hName: 'span', hProperties: { className: ['wiki-link-missing'], dataTitle: toString(node) } },
      } as never;
    });
  };
}
