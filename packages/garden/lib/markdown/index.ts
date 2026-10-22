// The site's Markdown pipeline, for garden/config.mjs (and the tests): the
// remark and rehype plugins in the order the HTML depends on.
import type { RehypePlugins, RemarkPlugin, RemarkPlugins } from '@astrojs/markdown-remark';
import type { Element } from 'hast';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeRaw from 'rehype-raw';
import wikiLinkPlugin from 'remark-wiki-link';
import type { TitleIndex } from '../titles.ts';
import { isExternal } from '../site.ts';
import rehypeCallouts from './rehype-callouts.ts';
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
 * target, as CommonMark's ExternalLinkExtension marked them. It runs before
 * rehype-raw, so raw HTML anchors in the content are left alone, as they were.
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

export function wikiRehypePlugins({
  siteUrl,
  publicDir,
}: Pick<PipelineOptions, 'siteUrl' | 'publicDir'>): RehypePlugins {
  return [
    ...externalLinks(siteUrl),
    // Raw HTML in the content becomes part of the tree before any plugin looks at it.
    rehypeRaw,
    rehypeHeadingIds,
    rehypeCallouts,
    [rehypeImages, { publicDir }],
    rehypeHeadingAnchors,
  ];
}
