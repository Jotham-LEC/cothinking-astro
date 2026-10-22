// Gives every heading an id from its text (slug.ts), before Astro collects
// `headings`: Astro keeps an id that is already there.
import type { Root } from 'hast';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import { uniqueSlugs } from './slug.ts';

export default function rehypeHeadingIds() {
  return (tree: Root) => {
    const slug = uniqueSlugs();
    visit(tree, 'element', (node) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      node.properties ??= {};
      if (node.properties.id === undefined || node.properties.id === '') node.properties.id = slug(toString(node));
    });
  };
}
