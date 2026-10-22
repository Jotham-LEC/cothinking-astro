// Images as App\Markdown\Images made them: the document's first image eager
// with a high fetch priority, the rest lazy; width and height read off the
// file for `/media/…` sources without a width; async decoding; `zoomable`
// unless inside a link; an image alone in its paragraph with a title becomes
// a captioned figure.
import fs from 'node:fs';
import path from 'node:path';
import type { Element, Root } from 'hast';
import { h } from 'hastscript';
import { imageSize } from 'image-size';
import { visit } from 'unist-util-visit';

export type ImagesOptions = { publicDir: string; mediaUrl?: string };

const sizes = new Map<string, { width: number; height: number } | null>();

export function measure(publicDir: string, src: string): { width: number; height: number } | null {
  const file = path.join(publicDir, decodeURIComponent(src.split(/[?#]/)[0]!));
  // Statamic's asset meta had no size for an SVG, so neither does the page.
  if (/\.svg$/i.test(file)) return null;
  if (!sizes.has(file)) {
    try {
      const { width, height } = imageSize(fs.readFileSync(file));
      sizes.set(file, width && height ? { width, height } : null);
    } catch {
      sizes.set(file, null);
    }
  }
  return sizes.get(file) ?? null;
}

export default function rehypeImages({ publicDir, mediaUrl = '/media/' }: ImagesOptions) {
  return (tree: Root) => {
    let first = true;
    const ancestors: Element[] = [];
    visit(
      tree,
      'element',
      (node, index, parent) => {
        if (node.tagName !== 'img' || !parent || index === undefined) return;
        const props = (node.properties ??= {});
        if (props.loading === undefined) props.loading = first ? 'eager' : 'lazy';
        if (first) props.fetchpriority = 'high';
        first = false;

        const src = String(props.src ?? '');
        if (props.width === undefined && src.startsWith(mediaUrl)) {
          const size = measure(publicDir, src);
          if (size) {
            props.width = size.width;
            props.height = size.height;
          }
        }
        props.decoding = 'async';

        const insideLink =
          ancestors.some((a) => a.tagName === 'a') || (parent.type === 'element' && parent.tagName === 'a');
        if (!insideLink) {
          const className: unknown = props.className;
          const classes = Array.isArray(className)
            ? className.map(String)
            : typeof className === 'string'
              ? className.split(/\s+/)
              : [];
          props.className = [...classes.filter(Boolean), 'zoomable'];
        }

        const caption = typeof props.title === 'string' ? props.title : '';
        const alone =
          parent.type === 'element' &&
          parent.tagName === 'p' &&
          parent.children.filter((c) => c.type === 'element').length === 1 &&
          parent.children.every((c) => c.type !== 'text' || c.value.trim() === '');
        if (caption !== '' && alone) {
          // Replace the paragraph itself with the figure (in its grandparent).
          parent.tagName = 'figure';
          parent.properties = { className: ['figure'] };
          parent.children = [node, h('figcaption', caption)];
        }
      },
      false,
    );
    // `visit` has no ancestor stack; links are checked by a second pass below.
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      visit(node, 'element', (child) => {
        if (child.tagName !== 'img' || !child.properties) return;
        const classes = Array.isArray(child.properties.className) ? child.properties.className : [];
        child.properties.className = classes.filter((c) => c !== 'zoomable');
        if (child.properties.className.length === 0) delete child.properties.className;
      });
    });
  };
}
