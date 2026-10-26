// cothink.ing's built site (sites/cothinking/dist/, from `npm run build -w sites/cothinking`):
// what only shows once Astro has put the pages together. Skipped, loudly, when there is no build.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dist = path.resolve(__dirname, '../dist');
const built = fs.existsSync(path.join(dist, 'index.html'));
if (!built)
  console.warn(
    'sites/cothinking/dist is missing: run `npm run build -w sites/cothinking`; its build tests are skipped.',
  );
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
      expect(html).toMatch(/<body[^>]*class="[^"]*bg-terminal/);
      expect(html).toContain('<div class="shell" data-room>');
      expect(html).not.toContain('id="rail"');
    }
    expect(read('wiki/speed-to-lead.html')).toContain('<div class="shell">');
  });
  it('resizes the work tiles to 800 × 450 and the testimonial photo to 96px', () => {
    const tiles = [...read('work.html').matchAll(/<img src="(\/_astro\/[^"]+\.webp)"[^>]*width="800" height="450"/g)];
    expect(tiles.length).toBe(8);
    const photo = /<img src="(\/_astro\/js-baskets-of-joy-heart-of-joy-hamper[^"]+)"/.exec(read('index.html'))![1]!;
    expect(fs.existsSync(path.join(dist, photo))).toBe(true);
  });
  it('writes each wiki page as Markdown, with its links as full addresses, and llms.txt links the copies', () => {
    // The pages, not the old addresses' redirect pages.
    const pages = fs
      .readdirSync(path.join(dist, 'wiki'))
      .filter((f) => f.endsWith('.html') && !read(`wiki/${f}`).includes('http-equiv="refresh"'));
    expect(pages.length).toBeGreaterThan(20);
    for (const page of pages) expect(fs.existsSync(path.join(dist, 'wiki', page.replace(/\.html$/, '.md')))).toBe(true);
    const md = read('wiki/what-is-dmarc.md');
    expect(md).toMatch(/^# What is DMARC\?\n\n> /);
    expect(md).toContain('See [Why are our emails going to spam?](https://cothink.ing/wiki/why-emails-go-to-spam).');
    expect(md).toContain('[business email compromise](https://cothink.ing/wiki/business-email-compromise-malaysia)');
    expect(md).not.toContain('[[');
    expect(read('wiki/blast-stack.md')).toMatch(
      /!\[[^\]]*\]\(https:\/\/cothink\.ing\/_astro\/01-blueprint\.[^)]+\.webp\)/,
    );
    expect(read('llms.txt')).toContain('(https://cothink.ing/wiki/what-is-dmarc.md)');
    const html = read('wiki/what-is-dmarc.html');
    expect(html).toContain('data-copy-markdown="/wiki/what-is-dmarc.md"');
    expect(html).toContain(
      'href="https://github.com/Jotham-LEC/cothinking-astro/edit/main/sites/cothinking/src/content/wiki/what-is-dmarc.md"',
    );
  });
  it('writes the eleven old addresses as redirect pages', () => {
    expect(read('articles.html')).toContain('content="0;url=/wiki"');
    expect(read('wiki/what-is-geo.html')).toContain('url=/wiki/appearing-in-google-and-ai-search');
  });
});
