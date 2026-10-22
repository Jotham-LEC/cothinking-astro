import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { headingSlug, laravelSlug, uniqueSlugs } from '../lib/markdown/slug.ts';

// Every heading id the Laravel site printed (scripts/dump-heading-ids.php), kept as a fixture.
const golden = path.resolve(__dirname, 'fixtures/heading-ids.json');

describe('laravelSlug', () => {
  it('matches Str::slug on the cases the Laravel tests name', () => {
    expect(laravelSlug('10. The pride & joy')).toBe('10-the-pride-joy');
    expect(laravelSlug('See the docs')).toBe('see-the-docs');
    expect(laravelSlug('a_b @ c')).toBe('a-b-at-c');
    expect(headingSlug('🔥')).toBe('section');
  });

  it('numbers duplicates like CommonMark', () => {
    const slug = uniqueSlugs();
    expect([slug('Notes'), slug('Notes'), slug('Notes')]).toEqual(['notes', 'notes-1', 'notes-2']);
  });

  it('reproduces every heading id the Laravel site printed', () => {
    const pages = JSON.parse(fs.readFileSync(golden, 'utf8')) as Record<
      string,
      { level: number; id: string; text: string }[]
    >;
    const wrong: string[] = [];
    for (const [url, headings] of Object.entries(pages)) {
      const slug = uniqueSlugs();
      for (const h of headings) {
        const got = slug(h.text);
        if (got !== h.id) wrong.push(`${url}: ${JSON.stringify(h.text)} → ${got} (expected ${h.id})`);
      }
    }
    expect(wrong).toEqual([]);
  });
});
