// A Shiki transformer that wraps each highlighted `<pre>` in the code
// block's chrome: a header with the language and a copy button, then the
// code. Plain HTML, so it works without JavaScript and nothing shifts when
// the page loads; scripts/site/code-copy.js makes the button copy.
import type { Root } from 'hast';
import { h } from 'hastscript';
import type { ShikiTransformer } from 'shiki';

export function codeBlock(): ShikiTransformer {
  return {
    name: 'code-block',
    root(root): Root {
      const lang = this.options.lang && this.options.lang !== 'plaintext' ? this.options.lang : 'code';
      const header = h('div.code-block-header', [
        h('span.code-block-lang', lang),
        h('button.code-block-copy', { type: 'button', ariaLabel: 'Copy code to clipboard' }, 'Copy'),
      ]);
      return { type: 'root', children: [h('div.code-block', [header, ...root.children])] };
    },
  };
}
