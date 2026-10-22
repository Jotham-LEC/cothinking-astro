// The Laravel app's tests/Feature/Markdown/WikiParserTest.php, run through
// Astro's own remark/rehype pipeline with the site's plugins.
import path from 'node:path';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Root } from 'hast';
import { renderFeed } from '../src/lib/markdown/feed.ts';
import { named } from '../src/lib/markdown/named.ts';
import rehypeCallouts from '../src/lib/markdown/rehype-callouts.ts';
import { wikiRehypePlugins, wikiRemarkPlugins } from '../src/lib/markdown/index.ts';

const titles = { 'older essay': '/essays/older-essay', cothinking: 'https://cothink.ing/' };
const publicDir = path.resolve(__dirname, '../public');
let render: (md: string) => Promise<string>;

beforeAll(async () => {
  const processor = await createMarkdownProcessor({
    remarkPlugins: wikiRemarkPlugins({ titles, siteUrl: 'https://jothamlim.com' }),
    rehypePlugins: wikiRehypePlugins({ siteUrl: 'https://jothamlim.com', publicDir }),
    gfm: true,
    smartypants: false,
    syntaxHighlight: false,
  });
  render = async (md) => (await processor.render(md)).code;
});

describe('headings and callouts', () => {
  it('gives a heading a unique id and makes it a link to itself with a link icon', async () => {
    const html = await render('## 10. The pride & joy\n\n## Notes\n\n## Notes\n\n### See [the docs](/docs)');
    expect(html).toContain(
      '<h2 id="10-the-pride-joy"><a href="#10-the-pride-joy" class="anchor">10. The pride &#x26; joy<svg class="anchor-icon" aria-hidden="true"',
    );
    expect(html).toContain(
      'See <a href="/docs">the docs</a><a href="#see-the-docs" class="anchor" aria-label="Link to this section: See the docs"><svg',
    );
    expect(html).toContain('id="notes"');
    expect(html).toContain('id="notes-1"');
  });

  it('never gives a heading an id the document already has', async () => {
    const html = await render('## Notes\n\n<h2 id="notes-1">Raw</h2>\n\n## Notes');
    expect([...html.matchAll(/<h2 id="([^"]+)"/g)].map((m) => m[1])).toEqual(['notes', 'notes-1', 'notes-2']);
  });

  it('turns GitHub-style alerts into callouts', async () => {
    expect(await render('> [!NOTE]\n> Mind this.')).toContain(
      '<div class="callout callout-note" role="note"><div class="callout-title">Note</div><div class="callout-body"><p>Mind this.</p>',
    );
    expect(await render('> [!WARNING] Heads up\n> Careful.')).toContain('<div class="callout-title">Heads up</div>');
    expect(await render('> [!INFO]\n> For your information.')).toContain(
      '<div class="callout callout-info" role="note"><div class="callout-title">Info</div>',
    );
    expect(await render('> [!TIP]\n>\n> Body.')).toContain(
      '<div class="callout-title">Tip</div><div class="callout-body"><p>Body.</p>',
    );
    expect(await render('> [!TIP] Read *this* and `that`\n> Body.')).toContain(
      '<div class="callout-title">Read this and that</div>',
    );
    const quote = await render('> Just a quote.');
    expect(quote).toContain('<blockquote>');
    expect(quote).not.toContain('callout');
    expect(await render('> [!UNKNOWN] Not a type\n> Body.')).toContain('<blockquote>');
  });

  it("keeps a callout's line break and later blocks, and finds one inside a list", async () => {
    expect(await render('> [!NOTE] Title  \n> Body after a hard break.')).toContain(
      '<div class="callout-title">Title</div><div class="callout-body"><p>Body after a hard break.</p>',
    );
    const blocks = await render('> [!IMPORTANT]\n> First.\n>\n> - a\n> - b');
    expect(blocks).toContain('<div class="callout-body"><p>First.</p>\n<ul>');
    expect(await render('- item\n\n  > [!TIP] In a list\n  > Body.')).toMatch(
      /<li>[\s\S]*<div class="callout callout-tip" role="note"><div class="callout-title">In a list<\/div>/,
    );
  });

  it('leaves MDX nodes in a blockquote alone (no serialising), and keeps them in a callout body', () => {
    const expression = { type: 'mdxTextExpression', value: '1 + 1' };
    const quote = (children: unknown[]) =>
      ({
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'blockquote',
            properties: {},
            children: [{ type: 'element', tagName: 'p', properties: {}, children }],
          },
        ],
      }) as unknown as Root;
    const plain = quote([{ type: 'text', value: 'A quote with an expression: ' }, expression]);
    rehypeCallouts()(plain);
    expect((plain.children[0] as { tagName: string }).tagName).toBe('blockquote');
    const leading = quote([expression, { type: 'text', value: ' first' }]);
    rehypeCallouts()(leading);
    expect((leading.children[0] as { tagName: string }).tagName).toBe('blockquote');
    const callout = quote([{ type: 'text', value: '[!NOTE] Sum\nIt is ' }, expression]);
    rehypeCallouts()(callout);
    expect(JSON.stringify(callout)).toContain('"callout-title"');
    expect(JSON.stringify(callout)).toContain('{"type":"mdxTextExpression","value":"1 + 1"}');
  });
});

describe('wiki links', () => {
  it('resolve to the page with that title, mark a missing one, and stay literal where they are not links', async () => {
    const html = await render('See [[Older Essay]], [[Older Essay|that one]] and [[Nowhere]].');
    expect(html).toContain('<a class="wiki-link" href="/essays/older-essay">Older Essay</a>');
    expect(html).toContain('<a class="wiki-link" href="/essays/older-essay">that one</a>');
    expect(html).toContain('<span class="wiki-link-missing" data-title="Nowhere">Nowhere</span>');
    expect(await render('[[Older Essay|Q&A notes]]')).toContain('href="/essays/older-essay">Q&#x26;A notes</a>');
    expect(await render('| Page | Note |\n| --- | --- |\n| [[Older Essay\\|the essay]] | x |')).toContain(
      '<td><a class="wiki-link" href="/essays/older-essay">the essay</a></td>',
    );
    const code = await render('Use `[[Older Essay]]` to link.\n\n```\n[[Older Essay]]\n```');
    expect(code).toContain('<code>[[Older Essay]]</code>');
    expect(code).not.toContain('wiki-link');
    const escaped = await render('Write \\[\\[Older Essay\\]\\] to link.');
    expect(escaped).toContain('[[Older Essay]]');
    expect(escaped).not.toContain('wiki-link');
    expect(await render('<div>\n[[Older Essay]]\n</div>')).not.toContain('wiki-link');
  });

  it('link the other site by its full address, marked external', async () => {
    expect(await render('See [[CoThinking]].')).toContain(
      '<a class="wiki-link external-link" href="https://cothink.ing/">CoThinking</a>',
    );
  });
});

describe('links, images and plain text', () => {
  it('autolinks bare URLs, marks only links to another site external, and does not force line breaks', async () => {
    const auto = await render('Visit https://example.com\nnext line');
    expect(auto).toMatch(/<a [^>]*href="https:\/\/example\.com"[^>]*>https:\/\/example\.com<\/a>/);
    expect(auto).not.toContain('<br');
    const html = await render(
      '[Out](https://example.com/post), [in](/essays/older-essay), [home](https://jothamlim.com/career), [mail](mailto:hi@jothamlim.com) and <a class="button" href="https://example.com/buy">Buy</a>.',
    );
    expect(html).toContain('<a href="https://example.com/post" class="external-link">Out</a>');
    expect(html.split('external-link').length - 1).toBe(1); // the raw-HTML button is left alone
  });

  it('loads the first image eagerly and the rest lazily, makes a titled lone image a figure, and measures media images', async () => {
    const html = await render('![Alt](/media/a.png "A caption")\n\nThen ![inline](/media/b.png "Kept") in text.');
    expect(html).toContain('loading="eager" fetchpriority="high"');
    expect(html).toContain('<figure class="figure">');
    expect(html).toContain('<figcaption>A caption</figcaption>');
    expect(html).toMatch(/<p>Then <img src="\/media\/b.png" alt="inline" title="Kept" loading="lazy"/);
    expect(html).not.toContain('<p><figure');
    const measured = await render('![](/media/profile-400.jpg)');
    expect(measured).toContain('width="400" height="400"');
    expect(measured).toContain('loading="eager"');
    const linked = await render('[![a](/media/profile-400.jpg)](/essays/older-essay)');
    expect(linked).not.toContain('zoomable');
    expect(await render('![x](/media/profile-400.jpg)')).toContain('class="zoomable"');
  });

  it('leaves Antlers-looking text, dollar amounts, dashes and quotes alone', async () => {
    expect(await render('Write `{{ title }}` and {{ title }}.')).toContain('{{ title }}');
    expect(await render('Worth US$3.8 billion, rising to US$35.8 billion.')).toContain(
      'US$3.8 billion, rising to US$35.8 billion',
    );
    expect(await render('Leads -- "quoted" and more...')).toContain('Leads -- "quoted" and more...');
  });

  it('keeps raw HTML and gives a bare code block its language class', async () => {
    const html = await render(
      '<figure class="wiki-pdf"><a class="wiki-pdf-preview" href="/x.pdf"><img src="/media/profile-400.jpg" alt="p" width="884" height="1200" /></a></figure>\n\n```sh\nls\n```',
    );
    expect(html).toContain('<figure class="wiki-pdf">');
    expect(html).toContain('width="884" height="1200"');
    expect(html).not.toContain('zoomable');
    expect(html).toContain('<pre><code class="language-sh">ls\n</code></pre>');
  });
});

describe('plugin errors', () => {
  it('name the plugin and the file', () => {
    const failing = named('rehype-example', () => {
      throw new Error('boom');
    });
    expect(() => failing({}, { path: 'src/content/essays/x.md' })).toThrow('[rehype-example] src/content/essays/x.md: boom');
  });
});

describe('feed parser', () => {
  it('resolves wiki links but adds no anchors, marks or callouts, and breaks lines only when asked', async () => {
    const essay = await renderFeed(
      '## One\n\nSee [[Older Essay]] and [x](https://example.com).\n\n> [!NOTE]\n> n',
      titles,
    );
    expect(essay).toContain('<h2>One</h2>');
    expect(essay).toContain('<a class="wiki-link" href="/essays/older-essay">Older Essay</a>');
    expect(essay).not.toContain('anchor');
    expect(essay).not.toContain('external-link');
    expect(essay).toContain('<blockquote>');
    expect(await renderFeed('Begin\ndoing.', titles, { breaks: true })).toContain('Begin<br>\ndoing.');
  });
});
