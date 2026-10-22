// Makes each h2–h4 with an id a link to itself: its content inside
// `<a class="anchor" href="#id">` with a link icon after it; a heading that
// already holds a link gets the icon alone as a named link
// (App\Markdown\HeadingAnchors).
import type { Element, Root } from 'hast';
import { toString } from 'hast-util-to-string';
import { h, s } from 'hastscript';
import { visit } from 'unist-util-visit';

export const ANCHOR_PATH =
  'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244';

const anchorIcon = (): Element =>
  s(
    'svg',
    {
      className: ['anchor-icon'],
      ariaHidden: 'true',
      fill: 'none',
      viewBox: '0 0 24 24',
      strokeWidth: '2',
      stroke: 'currentColor',
    },
    [s('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: ANCHOR_PATH })],
  );

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
          h(
            'a',
            { href: `#${id}`, className: ['anchor'], ariaLabel: `Link to this section: ${toString(node).trim()}` },
            [anchorIcon()],
          ),
        );
      } else {
        node.children = [h('a', { href: `#${id}`, className: ['anchor'] }, [...node.children, anchorIcon()])];
      }
    });
  };
}
