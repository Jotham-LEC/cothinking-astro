// Makes each h2–h4 with an id a link to itself: its content inside
// `<a class="anchor" href="#id">`; a heading that already holds a link gets
// an empty named link after it instead. The link icon is CSS
// (`.anchor::after`, styles/components.css); a click copies the address
// (scripts/heading-links.ts).
import type { Element, Root } from 'hast';
import { toString } from 'hast-util-to-string';
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';

const holdsLink = (node: Element): boolean => {
  let found = false;
  visit(node, 'element', (child) => {
    if (child.tagName === 'a') found = true;
  });
  return found;
};

export default function rehypeHeadingAnchors() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (!/^h[2-4]$/.test(node.tagName)) return;
      const id = node.properties?.id;
      if (typeof id !== 'string' || id === '') return;
      if (holdsLink(node)) {
        node.children.push(
          h('a', {
            href: `#${id}`,
            className: ['anchor'],
            ariaLabel: `Link to this section: ${toString(node).trim()}`,
          }),
        );
      } else {
        node.children = [h('a', { href: `#${id}`, className: ['anchor'] }, node.children)];
      }
    });
  };
}
