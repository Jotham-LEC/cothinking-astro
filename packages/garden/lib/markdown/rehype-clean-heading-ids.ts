// Gives every heading a GitHub-style id (github-slugger, as Astro's own
// rehypeHeadingIds would), with emoji left out of the text it slugs and every kind of
// space treated as one, so a heading that opens with an emoji or holds a
// non-breaking space gets a clean id. Astro's pass keeps the id and
// collects the headings, so the outline and the anchors agree.
import GithubSlugger from 'github-slugger';
import type { Root } from 'hast';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';

const EMOJI = /[\p{Extended_Pictographic}️‍]/gu;

export default function rehypeCleanHeadingIds() {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    visit(tree, 'element', (node) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      node.properties ??= {};
      if (typeof node.properties.id !== 'string')
        node.properties.id = slugger.slug(toString(node).replace(EMOJI, '').replace(/\s+/g, ' ').trim());
    });
  };
}
