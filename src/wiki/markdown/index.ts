// The site's Markdown pipeline, for astro.config.mjs (and the tests): the
// remark and rehype plugins in the order the HTML depends on.
import rehypeRaw from 'rehype-raw';
import wikiLinkPlugin from 'remark-wiki-link';
import type { PluggableList } from 'unified';
import type { TitleIndex } from '../titles.ts';
import rehypeCallouts from './rehype-callouts.ts';
import rehypeHeadingAnchors from './rehype-heading-anchors.ts';
import rehypeHeadingIds from './rehype-heading-ids.ts';
import rehypeImages from './rehype-images.ts';
import remarkExternalLinks from './remark-external-links.ts';
import remarkWikiLinks from './remark-wiki-links.ts';

export type PipelineOptions = { titles: TitleIndex; siteUrl: string; publicDir: string };

/** remark-wiki-link, parsing only: remark-wiki-links resolves the nodes. */
export const wikiLinkSyntax = (): PluggableList => [
  [wikiLinkPlugin, { aliasDivider: '|', pageResolver: (name: string) => [name], hrefTemplate: (p: string) => p }],
];

/** Raw HTML in the content becomes part of the tree before any plugin looks at it; MDX's own nodes pass through. */
export const rawHtml = (): PluggableList => [
  [
    rehypeRaw,
    { passThrough: ['mdxjsEsm', 'mdxJsxFlowElement', 'mdxJsxTextElement', 'mdxFlowExpression', 'mdxTextExpression'] },
  ],
];

export function wikiRemarkPlugins({ titles, siteUrl }: Pick<PipelineOptions, 'titles' | 'siteUrl'>): PluggableList {
  return [...wikiLinkSyntax(), [remarkWikiLinks, { titles, siteUrl }], [remarkExternalLinks, { siteUrl }]];
}

export function wikiRehypePlugins({ publicDir }: Pick<PipelineOptions, 'publicDir'>): PluggableList {
  return [...rawHtml(), rehypeHeadingIds, rehypeCallouts, [rehypeImages, { publicDir }], rehypeHeadingAnchors];
}
