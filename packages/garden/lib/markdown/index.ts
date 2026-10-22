// The Markdown pipeline, for garden/config.mjs (and the tests): the remark
// and rehype plugins in the order the HTML depends on, around Astro's own
// processor (GFM, Shiki, raw HTML, images, headings).
import type { RehypePlugins, RemarkPlugin, RemarkPlugins } from '@astrojs/markdown-remark';
import type { Element } from 'hast';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeRaw from 'rehype-raw';
import wikiLinkPlugin from 'remark-wiki-link';
import { isExternal } from '../site.ts';
import type { TitleIndex } from '../titles.ts';
import rehypeCallouts from './rehype-callouts.ts';
import rehypeExcerpt from './rehype-excerpt.ts';
import rehypeHeadingAnchors from './rehype-heading-anchors.ts';
import rehypeHeadingIds from './rehype-heading-ids.ts';
import rehypeImages from './rehype-images.ts';
import remarkWikiLinks from './remark-wiki-links.ts';

type PipelineOptions = { titles: () => TitleIndex; siteUrl: string; publicDir: string };

/** remark-wiki-link, parsing only: remark-wiki-links resolves the nodes. */
export const wikiLinkSyntax = (): [RemarkPlugin, unknown][] => [
  [
    wikiLinkPlugin as RemarkPlugin,
    { aliasDivider: '|', pageResolver: (name: string) => [name], hrefTemplate: (p: string) => p },
  ],
];

export function wikiRemarkPlugins({ titles, siteUrl }: Pick<PipelineOptions, 'titles' | 'siteUrl'>): RemarkPlugins {
  return [...wikiLinkSyntax(), [remarkWikiLinks, { titles, siteUrl }]];
}

/**
 * Markdown links that leave the site get `class="external-link"`, no rel, no
 * target. It runs before rehype-raw, so raw HTML anchors in the content are
 * left alone.
 */
export const externalLinks = (siteUrl: string): RehypePlugins => [
  [
    rehypeExternalLinks,
    {
      rel: [],
      target: false,
      test: (el: Element) => typeof el.properties.href === 'string' && isExternal(el.properties.href, siteUrl),
      properties: (el: Element) => {
        const classes = Array.isArray(el.properties.className) ? el.properties.className.map(String) : [];
        return { className: classes.includes('external-link') ? classes : [...classes, 'external-link'] };
      },
    },
  ],
];

/**
 * The rehype plugins: external links; raw HTML into the tree; heading ids
 * (GitHub-style, which Astro's own pass keeps, so `headings` and the anchors
 * agree); callouts; the excerpt; images; then each heading made a link to itself.
 */
export function wikiRehypePlugins({
  siteUrl,
  publicDir,
}: Pick<PipelineOptions, 'siteUrl' | 'publicDir'>): RehypePlugins {
  return [
    ...externalLinks(siteUrl),
    rehypeRaw,
    rehypeHeadingIds,
    rehypeCallouts,
    rehypeExcerpt,
    [rehypeImages, { publicDir }],
    rehypeHeadingAnchors,
  ];
}
