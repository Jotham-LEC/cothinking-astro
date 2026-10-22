// The site's entries for the garden (garden/lib/load.ts): every content
// collection as SiteEntries, and the other site's, scanned off its folder,
// for `[[wiki links]]` to its pages.
import { getCollection } from 'astro:content';
import { root } from 'astro:config/server';
import { toSiteEntry, type SiteEntry } from '@garden/lib/entry.ts';
import { scanEntries } from '@garden/lib/scan.ts';
import { urlOf as otherUrlOf } from '../../../cothinking/src/lib/urls.ts';
import { urlOf } from './urls.ts';

const COLLECTIONS = ['essays', 'notes', 'pages', 'projects', 'publications'] as const;

export async function loadEntries(): Promise<SiteEntry[]> {
  const all = await Promise.all(COLLECTIONS.map((c) => getCollection(c)));
  return all.flat().map((e) => toSiteEntry(e, urlOf));
}

export const otherEntries = (): SiteEntry[] => scanEntries(new URL('../cothinking/', root), otherUrlOf);
