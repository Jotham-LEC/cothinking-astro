// The Markdown pipeline: Astro's own remark/rehype processor with the garden's plugins.
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { beforeAll, describe, expect, it } from 'vitest';
import { wikiRehypePlugins, wikiRemarkPlugins } from '../lib/markdown/index.ts';
import { codeBlock } from '../lib/markdown/shiki-code-block.ts';

const titles = { 'older essay': '/essays/older-essay', cothinking: 'https://cothink.ing/' };
let processor: Awaited<ReturnType<typeof createMarkdownProcessor>>;
let render: (md: string) => Promise<string>;

beforeAll(async () => {
  processor = await createMarkdownProcessor({
    remarkPlugins: wikiRemarkPlugins({ titles: () => titles, siteUrl: 'https://jothamlim.com' }),
    rehypePlugins: wikiRehypePlugins({ siteUrl: 'https://jothamlim.com' }),
    gfm: true,
    smartypants: false,
    syntaxHighlight: { type: 'shiki' },
    shikiConfig: {
      themes: { light: 'gruvbox-light-soft', dark: 'gruvbox-dark-soft' },
      defaultColor: false,
      transformers: [codeBlock()],
    },
  });
  render = async (md) => (await processor.render(md)).code;
});

describe('headings and callouts', () => {
  it('gives a heading a unique GitHub-style id and makes it a link to itself', async () => {
    const html = await render(
      '## 10. The pride & joy\n\n## Notes\n\n## Notes\n\n### See [the docs](/docs)\n\n## 🚀 Launch',
    );
    expect(html).toContain(
      '<h2 id="10-the-pride--joy"><a href="#10-the-pride--joy" class="anchor">10. The pride &#x26; joy</a></h2>',
    );
    expect(html).toContain(
      'See <a href="/docs">the docs</a><a href="#see-the-docs" class="anchor" aria-label="Link to this section: See the docs"></a>',
    );
    expect(html).toContain('id="notes"');
    expect(html).toContain('id="notes-1"');
    expect(html).toContain('<h2 id="launch">');
  });

  it('collects the opening paragraphs as the excerpt', async () => {
    const { metadata } = await processor.render(
      '> [!NOTE]\n> First.\n\nSecond **bold**.\n\n```\ncode\n```\n\nThird.\n\nFourth.',
    );
    expect(metadata.frontmatter.paragraphs).toEqual(['First.', 'Second bold.', 'Third.']);
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

  it("labels a task item's checkbox with the item's text, without its nested list", async () => {
    const html = await render('- [ ] Turn on `2FA` for them\n  - [x] Nested one\n- [x] Done');
    expect(html).toContain('aria-label="Turn on 2FA for them"');
    expect(html).toContain('aria-label="Nested one"');
    expect(html).toContain('aria-label="Done"');
    const loose = await render('- [ ] First\n\n- [ ] Second');
    expect(loose).toContain('aria-label="First"');
  });

  it('leaves Antlers-looking text, dollar amounts, dashes and quotes alone', async () => {
    expect(await render('Write `{{ title }}` and {{ title }}.')).toContain('{{ title }}');
    expect(await render('Worth US$3.8 billion, rising to US$35.8 billion.')).toContain(
      'US$3.8 billion, rising to US$35.8 billion',
    );
    expect(await render('Leads -- "quoted" and more...')).toContain('Leads -- "quoted" and more...');
  });

  it('keeps raw HTML and Markdown images as they are, and highlights a code block in both themes inside its chrome', async () => {
    const html = await render(
      '<figure class="wiki-pdf"><a class="wiki-pdf-preview" href="/x.pdf"><img src="/media/p.jpg" alt="p" width="884" height="1200" loading="lazy" /></a></figure>\n\n![A photo](../../assets/media/a.png)\n\n```sh\nls\n```\n\n```\nplain\n```',
    );
    expect(html).toContain('<figure class="wiki-pdf">');
    expect(html).toContain('width="884" height="1200" loading="lazy"');
    expect(html).toContain('<img src="../../assets/media/a.png" alt="A photo">');
    expect(html).toMatch(
      /<div class="code-block"><div class="code-block-header"><span class="code-block-lang">sh<\/span><button [^>]*class="code-block-copy"[^>]*>Copy<\/button><\/div><pre class="astro-code astro-code-themes gruvbox-light-soft gruvbox-dark-soft" style="--shiki-light:/,
    );
    expect(html).toContain('<span class="code-block-lang">code</span>');
    expect(html).toContain('--shiki-dark:');
  });
});
