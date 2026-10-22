// `> [!NOTE]` blockquotes become callouts, as App\Markdown\Callouts did: the
// blockquote's first paragraph opens with the marker; the rest of that line
// is the title (plain text, the type's name when empty); everything after it
// is the body. Worked on the tree, so a blockquote holding MDX nodes (an
// `{expression}`, a component) is left as it is or keeps them in the body.
import type { Element, ElementContent, Root, Text } from 'hast';
import { toString } from 'hast-util-to-string';
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = ['note', 'info', 'tip', 'important', 'warning', 'danger', 'caution'];

const MARKER = /^\s*\[!(\w+)\]/;

const blank = (node: ElementContent) => node.type === 'text' && node.value.trim() === '';

/** Splits a paragraph's inline nodes at the first line break: a newline in a text node, or a `<br>`. */
function splitLine(nodes: ElementContent[]): { line: ElementContent[]; rest: ElementContent[] } {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    if (node.type === 'element' && node.tagName === 'br') {
      const rest = nodes.slice(i + 1);
      return { line: nodes.slice(0, i), rest: trimStart(rest) };
    }
    if (node.type === 'text' && node.value.includes('\n')) {
      const at = node.value.indexOf('\n');
      const before: Text = { type: 'text', value: node.value.slice(0, at) };
      const after: Text = { type: 'text', value: node.value.slice(at + 1) };
      return { line: [...nodes.slice(0, i), before], rest: trimStart([after, ...nodes.slice(i + 1)]) };
    }
  }
  return { line: nodes, rest: [] };
}

/** Drops leading whitespace: blank text nodes, and the start of the first text. */
function trimStart(nodes: ElementContent[]): ElementContent[] {
  const out = [...nodes];
  while (out.length && blank(out[0]!)) out.shift();
  const first = out[0];
  if (first?.type === 'text') out[0] = { ...first, value: first.value.replace(/^\s+/, '') };
  return out;
}

function trimEnds(nodes: ElementContent[]): ElementContent[] {
  const out = trimStart(nodes);
  while (out.length && blank(out[out.length - 1]!)) out.pop();
  return out;
}

export default function rehypeCallouts() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'blockquote' || !parent || index === undefined) return;
      const at = node.children.findIndex((child) => !blank(child));
      const first = node.children[at];
      if (!first || first.type !== 'element' || first.tagName !== 'p') return;
      const opening = first.children[0];
      const marker = opening?.type === 'text' ? MARKER.exec(opening.value) : null;
      if (!opening || opening.type !== 'text' || !marker) return;
      const type = marker[1]!.toLowerCase();
      if (!CALLOUT_TYPES.includes(type)) return;

      const afterMarker: Text = { type: 'text', value: opening.value.slice(marker[0].length) };
      const { line, rest } = splitLine([afterMarker, ...first.children.slice(1)]);
      const title = toString({ type: 'element', tagName: 'span', properties: {}, children: line }).trim();

      const paragraph: Element[] = rest.length ? [{ ...first, children: rest }] : [];
      const body = trimEnds([...paragraph, ...node.children.slice(at + 1)]);

      parent.children[index] = h('div', { className: ['callout', `callout-${type}`], role: 'note' }, [
        h('div', { className: ['callout-title'] }, title || type.charAt(0).toUpperCase() + type.slice(1)),
        h('div', { className: ['callout-body'] }, body),
      ]);
    });
  };
}
