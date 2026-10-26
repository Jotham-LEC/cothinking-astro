// The content components, written with remark-directive's fences:
//
//   :::tabs            each `::tab[Label]` starts a panel; scripts/tabs.ts
//   ::tab[Label]       makes them tabs, and without it every panel shows
//   …                  under its label
//   :::
//   :::cards           the list inside as a grid of cards (an item's first
//   - [[Page]] …       link covers its card)
//   :::
//   :::steps           the ordered list inside as numbered steps
//   1. …
//   :::
//
// A fence holding another fence (steps holding tabs) takes one more colon.
// Any other directive is text the parser took for one (`TL:DR`, `1:80`), put
// back as written; an unknown fence keeps what it holds.
import type { Paragraph, Parent, Root, RootContent } from 'mdast';
import type { ContainerDirective, LeafDirective, TextDirective } from 'mdast-util-directive';
import type {} from 'mdast-util-to-hast';
import { toString } from 'mdast-util-to-string';
import type { VFile } from 'vfile';

type Directive = ContainerDirective | LeafDirective | TextDirective;

const MARKS = { textDirective: ':', leafDirective: '::', containerDirective: ':::' } as const;

const isDirective = (node: { type: string }): node is Directive => node.type in MARKS;

/** What a fence holds, without its `[label]`, which no component uses. */
const contents = (node: ContainerDirective) =>
  node.children.filter((child) => !(child.type === 'paragraph' && child.data?.directiveLabel));

/** A container that renders as `<tag class>` around what it holds. */
const element = (
  node: ContainerDirective,
  tagName: string,
  className: string,
  children: ContainerDirective['children'],
): ContainerDirective => ({
  ...node,
  children,
  data: { hName: tagName, hProperties: { className: [className] } },
});

/** Each `::tab[Label]` and what follows it, as a panel with its label first; what comes before the first tab stays above them. */
function tabs(node: ContainerDirective): RootContent[] {
  const before: ContainerDirective['children'] = [];
  const panels: ContainerDirective[] = [];
  for (const child of contents(node)) {
    if (child.type === 'leafDirective' && child.name === 'tab') {
      const label: Paragraph = {
        type: 'paragraph',
        children: [{ type: 'text', value: toString(child).trim() || `Tab ${panels.length + 1}` }],
        data: { hProperties: { className: ['tab-label'] } },
      };
      panels.push({
        type: 'containerDirective',
        name: 'tab-panel',
        attributes: {},
        children: [label],
        data: { hName: 'div', hProperties: { className: ['tab-panel'] } },
      });
    } else if (panels.length) panels.at(-1)!.children.push(child);
    else before.push(child);
  }
  return [...before, element(node, 'div', 'tabs', panels)];
}

/** A directive no component claims, as it was written. */
function asWritten(node: Directive, source: string): RootContent[] {
  if (node.type === 'containerDirective') return contents(node);
  const { start, end } = node.position ?? {};
  const value =
    source && start?.offset !== undefined && end?.offset !== undefined
      ? source.slice(start.offset, end.offset)
      : MARKS[node.type] + node.name;
  return node.type === 'textDirective'
    ? [{ type: 'text', value }]
    : [{ type: 'paragraph', children: [{ type: 'text', value }] }];
}

function transform(node: Directive, source: string): RootContent[] {
  if (node.type === 'containerDirective') {
    if (node.name === 'tabs') return tabs(node);
    if (node.name === 'cards') return [element(node, 'div', 'cards', contents(node))];
    if (node.name === 'steps') return [element(node, 'div', 'steps', contents(node))];
  }
  return asWritten(node, source);
}

/** Innermost first, so a fence's children are final before it is rebuilt; a tab's `::tab` is left for its fence. */
function walk(parent: Parent, source: string) {
  const inTabs = parent.type === 'containerDirective' && (parent as ContainerDirective).name === 'tabs';
  parent.children = (parent.children as RootContent[]).flatMap((child) => {
    if ('children' in child) walk(child, source);
    if (!isDirective(child) || (inTabs && child.type === 'leafDirective' && child.name === 'tab')) return [child];
    return transform(child, source);
  }) as Parent['children'];
}

export default function remarkDirectives() {
  return (tree: Root, file: VFile) =>
    walk(tree, typeof file.value === 'string' ? file.value : String(file.value ?? ''));
}
