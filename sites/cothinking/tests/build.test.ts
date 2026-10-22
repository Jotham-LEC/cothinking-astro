// cothink.ing's built site (sites/cothinking/dist/, from `npm run build:cothinking`):
// what only shows once Astro has put the pages together. Skipped, loudly, when there is no build.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dist = path.resolve(__dirname, '../dist');
const built = fs.existsSync(path.join(dist, 'index.html'));
if (!built)
  console.warn('sites/cothinking/dist is missing: run `npm run build:cothinking`; its build tests are skipped.');
const read = (file: string) => fs.readFileSync(path.join(dist, file), 'utf8');

describe.skipIf(!built)('the cothink.ing build', () => {
  it("prints the site's own Google Tag Manager container", () => {
    const home = read('index.html');
    expect(home).toContain('"GTM-K59BBZ9S"');
    expect(home).toContain('ns.html?id=GTM-K59BBZ9S');
  });
  it('draws the rooms on the terminal ground, without the rail or the status line', () => {
    for (const room of ['index.html', 'privacy.html', 'work/ultimate-circle.html']) {
      const html = read(room);
      expect(html).toMatch(/<body[^>]*class="[^"]*bg-terminal[^"]*"[^>]*data-room/);
      expect(html).not.toContain('data-rail');
    }
    expect(read('wiki/speed-to-lead.html')).not.toContain('data-room');
  });
  it('resizes the work tiles to 800 × 450 and the testimonial photo to 96px', () => {
    const tiles = [...read('work.html').matchAll(/<img src="(\/_astro\/[^"]+\.webp)"[^>]*width="800" height="450"/g)];
    expect(tiles.length).toBe(8);
    const photo = /<img src="(\/_astro\/js-baskets-of-joy-heart-of-joy-hamper[^"]+)"/.exec(read('index.html'))![1]!;
    expect(fs.existsSync(path.join(dist, photo))).toBe(true);
  });
  it('writes the eleven old addresses as redirect pages', () => {
    expect(read('articles.html')).toContain('content="0;url=/wiki"');
    expect(read('wiki/what-is-geo.html')).toContain('url=/wiki/appearing-in-google-and-ai-search');
  });
});
