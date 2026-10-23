// A GFM task item's checkbox (`- [ ] Do this`) has no label of its own, so a
// screen reader announces only "checkbox": it gets the item's text as its
// `aria-label`, without the nested lists. In a loose list the checkbox sits
// inside the item's first paragraph.
import type { Element, ElementContent, Root } from 'hast';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';

const isElement = (node: ElementContent | undefined, tagName: string): node is Element =>
  node?.type === 'element' && node.tagName === tagName;

const isCheckbox = (node: ElementContent): boolean => isElement(node, 'input') && node.properties.type === 'checkbox';

function checkboxOf(item: Element): Element | undefined {
  const first = item.children.find((child): child is Element => child.type === 'element');
  if (!first) return undefined;
  if (isCheckbox(first)) return first;
  const inParagraph = first.tagName === 'p' ? first.children.find(isCheckbox) : undefined;
  return inParagraph as Element | undefined;
}

export default function rehypeTaskLists() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'li') return;
      const classes = node.properties.className;
      if (!Array.isArray(classes) || !classes.includes('task-list-item')) return;
      const checkbox = checkboxOf(node);
      if (!checkbox) return;
      const own = node.children.filter((child) => !isElement(child, 'ul') && !isElement(child, 'ol'));
      const label = toString({ type: 'element', tagName: 'li', properties: {}, children: own })
        .replace(/\s+/g, ' ')
        .trim();
      if (label) checkbox.properties.ariaLabel = label;
    });
  };
}
