// Gives every heading an id from its text (slug.ts), before Astro collects
// `headings`: Astro keeps an id that is already there. Ids the document
// already has (raw HTML) are reserved first, so no two elements share one.
import type { Root } from 'hast';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import { uniqueSlugs } from './slug.ts';

export default function rehypeHeadingIds() {
  return (tree: Root) => {
    const taken: string[] = [];
    visit(tree, 'element', (node) => {
      if (typeof node.properties?.id === 'string' && node.properties.id !== '') taken.push(node.properties.id);
    });
    const slug = uniqueSlugs(undefined, taken);
    visit(tree, 'element', (node) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      node.properties ??= {};
      if (node.properties.id === undefined || node.properties.id === '') node.properties.id = slug(toString(node));
    });
  };
}
