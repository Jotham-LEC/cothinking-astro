// /<path>.md: a page as Markdown (lib/markdownCopy.ts), for each published page
// of a collection with `markdown` (site.config.ts); the Copy as Markdown button
// and llms.txt link it. Links resolve against the Markdown pipeline's own link
// index (virtual:garden/link-index, from garden/config.mjs).
import type { APIRoute, GetStaticPaths } from 'astro';
import { linkIndex } from 'virtual:garden/link-index';
import { garden, site } from '../lib/load.ts';
import { markdownCopy } from '../lib/markdownCopy.ts';

export const getStaticPaths = (async () => {
  const { live } = await garden();
  return live
    .filter((p) => site.collections[p.collection]?.markdown && p.url !== '/')
    .map((p) => ({ params: { uri: p.url.slice(1) }, props: { page: p } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { htmlOf } = await garden();
  // The pictures Astro optimised, in the order the body has them.
  const images = [...(await htmlOf(props.page)).matchAll(/<img\b[^>]*\ssrc="(\/_astro\/[^"]+)"/g)].map((m) => m[1]!);
  const text = markdownCopy(props.page, { index: linkIndex(), site, images });
  return new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
