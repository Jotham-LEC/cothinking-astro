// `> [!NOTE]` blockquotes become callouts, as App\Markdown\Callouts did on the
// rendered HTML: the same regexes over the blockquote's inner HTML, so the
// edge cases (a marker alone, a formatted title) come out the same.
import type { Root } from 'hast';
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic';
import { toHtml } from 'hast-util-to-html';
import { toString } from 'hast-util-to-string';
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';

export const CALLOUT_TYPES = ['note', 'info', 'tip', 'important', 'warning', 'danger', 'caution'];

const fragment = (html: string) => fromHtmlIsomorphic(html, { fragment: true }).children as Root['children'];

export default function rehypeCallouts() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'blockquote' || !parent || index === undefined) return;
      const inner = toHtml(node.children);
      const marker = /^\s*<p>\s*\[!(\w+)\]/i.exec(inner);
      if (!marker) return;
      const type = marker[1]!.toLowerCase();
      if (!CALLOUT_TYPES.includes(type)) return;

      let title = '';
      const titled = /^\s*<p>\s*\[!\w+\][ \t]*(.*?)[ \t]*(?=\n|<br\s*\/?>|<\/p>)/i.exec(inner);
      if (titled) title = toString({ type: 'root', children: fragment(titled[1]!) } as Root).trim();
      if (title === '') title = type.charAt(0).toUpperCase() + type.slice(1);

      let body = inner.replace(/^(\s*<p>)\s*\[!\w+\](?:(?!<\/p>)[^\n])*(?:\n|<br\s*\/?>)?\s*/i, '$1');
      body = body.replace(/^\s*<p>\s*<\/p>\s*/, '');

      parent.children[index] = h('div', { className: ['callout', `callout-${type}`], role: 'note' }, [
        h('div', { className: ['callout-title'] }, title),
        h('div', { className: ['callout-body'] }, fragment(body.trim())),
      ]);
    });
  };
}
