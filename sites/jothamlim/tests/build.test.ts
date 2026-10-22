// jothamlim.com's built site (sites/jothamlim/dist/, from `npm run build:jothamlim`): what only shows once Astro has
// put the pages together. Skipped, loudly, when there is no build.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dist = path.resolve(__dirname, '../dist');
const built = fs.existsSync(path.join(dist, 'index.html'));
if (!built) console.warn('dist/ is missing: run `npm run build:jothamlim` first; the build tests are skipped.');
const read = (file: string) => fs.readFileSync(path.join(dist, file), 'utf8');
const htmlIn = (dir: string): string[] =>
  fs.existsSync(path.join(dist, dir))
    ? fs
        .readdirSync(path.join(dist, dir), { recursive: true, encoding: 'utf8' })
        .filter((f) => f.endsWith('.html'))
        .map((f) => path.join(dir, f))
    : [];

describe.skipIf(!built)('the build', () => {
  it('prints Google Tag Manager from the Marketing settings, head and body', () => {
    const html = read('index.html');
    const head = html.slice(0, html.indexOf('<title>'));
    expect(head).toContain("(window,document,'script','dataLayer',\"GTM-M5NLR7CX\")");
    expect(html).toMatch(
      /<body[^>]*><noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-M5NLR7CX"[^>]*title="Google Tag Manager"><\/iframe><\/noscript>/,
    );
  });

  it('loads at most one image of a stream page eagerly', () => {
    const streams = ['notes.html', ...htmlIn('notes/type')];
    for (const file of streams) {
      const stream = read(file).split('data-stream')[1] ?? '';
      expect(stream.match(/fetchpriority="high"/g)?.length ?? 0, file).toBeLessThanOrEqual(1);
    }
  });

  it('gives each later notes page its own address and its prev/next links', () => {
    // Pages /notes/2… exist from the 21st note on; until then there is nothing to look at.
    const later = fs.existsSync(path.join(dist, 'notes'))
      ? fs.readdirSync(path.join(dist, 'notes')).filter((f) => /^\d+\.html$/.test(f))
      : [];
    for (const file of later) {
      const html = read(`notes/${file}`);
      const n = file.replace('.html', '');
      expect(html).toContain(`<link rel="canonical" href="https://jothamlim.com/notes/${n}">`);
      expect(html).toMatch(/<link rel="prev" href="\/notes(\/\d+)?">/);
    }
  });
});
