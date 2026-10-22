import { describe, expect, it } from 'vitest';
import { atom, day, formatDate, rfc2822, year } from '../src/lib/dates.ts';
import { byDateDesc, childrenOf, mountedOn, sectionOf, toPages } from '../src/lib/pages.ts';
import { readTime, wordCount } from '../src/lib/readTime.ts';
import { titleIndex, resolveTitle } from '../src/lib/titles.ts';
import type { Collections } from '../src/lib/types.ts';

const collections: Collections = {
  pages: { title: 'Pages', route: '{parent_uri}/{slug}', dated: false, root: true, orderable: false },
  essays: {
    title: 'Essays',
    route: '{mount}/{slug}',
    dated: true,
    root: false,
    orderable: false,
    mount: { collection: 'pages', slug: 'essays' },
  },
  problems: {
    title: 'Problems',
    route: '/{slug}',
    dated: false,
    root: false,
    orderable: true,
    mount: { collection: 'pages', slug: 'problems' },
  },
};

const pages = toPages(
  [
    { collection: 'pages', slug: 'home', data: { title: 'Home', order: 0 }, body: '' },
    { collection: 'pages', slug: 'essays', data: { title: 'Essays', order: 1 }, body: '' },
    { collection: 'pages', slug: 'problems', data: { title: 'Problems', order: 2 }, body: '' },
    { collection: 'pages', slug: 'child', data: { title: 'Child', order: 3, parent: 'essays' }, body: '' },
    { collection: 'pages', slug: 'lost', data: { title: 'Lost' }, body: '' },
    {
      collection: 'essays',
      slug: 'older',
      data: { title: 'Older Essay', date: new Date('2023-01-02T00:00:00Z') },
      body: 'Hello world',
    },
    { collection: 'essays', slug: 'newer', data: { title: 'Newer', date: new Date('2024-05-06T00:00:00Z') }, body: '' },
    {
      collection: 'essays',
      slug: 'draft',
      data: { title: 'Draft', date: new Date('2025-01-01T00:00:00Z'), draft: true },
      body: '',
    },
    { collection: 'problems', slug: 'spam', data: { title: 'Spam', order: 1 }, body: '' },
    { collection: 'problems', slug: 'slow', data: { title: 'Slow', order: 0 }, body: '' },
  ],
  collections,
);
const url = (slug: string) => pages.find((p) => p.slug === slug)!.url;

describe('urls', () => {
  it('follow each collection route', () => {
    expect(url('home')).toBe('/');
    expect(url('essays')).toBe('/essays');
    expect(url('child')).toBe('/essays/child');
    expect(url('lost')).toBeNull();
    expect(url('older')).toBe('/essays/older');
    expect(url('spam')).toBe('/spam');
  });
});

describe('pages', () => {
  it('knows sections, mounts and ordering', () => {
    expect(
      mountedOn(
        pages.find((p) => p.slug === 'essays')!,
        collections,
      ),
    ).toBe('essays');
    expect(
      sectionOf(
        pages.find((p) => p.slug === 'older')!,
        collections,
      ),
    ).toBe('essays');
    expect(childrenOf('essays', pages, collections).map((p) => p.slug)).toEqual(['newer', 'older']);
    expect(childrenOf('problems', pages, collections).map((p) => p.slug)).toEqual(['slow', 'spam']);
    expect(byDateDesc(pages.filter((p) => p.collection === 'essays')).map((p) => p.slug)).toEqual([
      'draft',
      'newer',
      'older',
    ]);
  });
});

describe('dates', () => {
  it('print in Kuala Lumpur, feeds in UTC', () => {
    const late = new Date('2026-10-07T17:30:00Z'); // 01:30 the next day in KL
    expect(day(late)).toBe('2026-10-08');
    expect(year(new Date('2020-12-31T18:00:00Z'))).toBe('2021');
    expect(formatDate(late, 'j F Y')).toBe('8 October 2026');
    expect(formatDate(late, 'M')).toBe('Oct');
    expect(rfc2822(new Date('2026-10-15T06:38:00Z'))).toBe('Thu, 15 Oct 2026 06:38:00 +0000');
    expect(atom(new Date('2023-01-18T00:00:00Z'))).toBe('2023-01-18T00:00:00+00:00');
  });
});

describe('read time', () => {
  it('counts words as Statamic does', () => {
    expect(wordCount("Don't count <b>tags</b>, 0 or punctuation... but 10 yes")).toBe(8);
    expect(readTime('word '.repeat(201))).toBe(2);
    expect(readTime('')).toBe(0);
  });
});

describe('titles', () => {
  it('index this site over the other, case-insensitively, trimming a table cell backslash', () => {
    const index = titleIndex(pages, { cothinking: 'https://cothink.ing/', stale: '/old' });
    expect(resolveTitle(index, 'older essay')).toBe('/essays/older');
    expect(resolveTitle(index, 'Older Essay\\')).toBe('/essays/older');
    expect(resolveTitle(index, 'CoThinking')).toBe('https://cothink.ing/');
    expect(resolveTitle(index, 'Draft')).toBeNull();
    expect(resolveTitle(index, 'stale')).toBeNull();
  });
});
