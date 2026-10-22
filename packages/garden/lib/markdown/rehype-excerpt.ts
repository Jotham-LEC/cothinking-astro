// The page's opening paragraphs as plain text, for a description: the first
// three non-empty `<p>` in document order (a callout's text counts, as the
// callouts are already rendered), written to the entry's rendered front
// matter (`rendered.metadata.frontmatter.paragraphs`), where the loader
// reads them (garden/lib/entry.ts).
import type { Root } from 'hast';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

const PARAGRAPHS = 3;

export default function rehypeExcerpt() {
  return (tree: Root, file: VFile) => {
    const paragraphs: string[] = [];
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'p' || paragraphs.length >= PARAGRAPHS) return;
      const text = toString(node).replace(/\s+/g, ' ').trim();
      if (text !== '') paragraphs.push(text);
    });
    const data = file.data as { astro?: { frontmatter?: Record<string, unknown> } };
    data.astro ??= {};
    data.astro.frontmatter ??= {};
    data.astro.frontmatter.paragraphs = paragraphs;
  };
}
