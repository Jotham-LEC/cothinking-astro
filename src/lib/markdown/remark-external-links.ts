// Marks Markdown links that leave the site, as CommonMark's
// ExternalLinkExtension did: a link (or an autolinked URL) whose host is not
// the site's own gets `class="external-link"`, no rel, no target. Raw HTML
// anchors in the content are left alone, as they were.
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export function isExternal(href: string, siteUrl: string): boolean {
  try {
    const url = new URL(href);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.host !== new URL(siteUrl).host;
  } catch {
    return false;
  }
}

export default function remarkExternalLinks({ siteUrl }: { siteUrl: string }) {
  return (tree: Root) => {
    visit(tree, 'link', (node) => {
      if (!isExternal(node.url, siteUrl)) return;
      node.data ??= {};
      const props = (node.data.hProperties ??= {}) as Record<string, unknown>;
      const classes = Array.isArray(props.className)
        ? props.className.map(String)
        : typeof props.className === 'string'
          ? props.className.split(/\s+/)
          : [];
      if (!classes.includes('external-link')) props.className = [...classes.filter(Boolean), 'external-link'];
    });
  };
}
