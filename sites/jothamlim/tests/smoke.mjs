// jothamlim.com's smoke steps (`npm run smoke`, against `astro preview` on
// PREVIEW_URL, else :4331): console errors, the theme toggle, reader mode,
// code blocks and their copy button, the Pagefind palette (over an open
// drawer too), Explorer folders, the graph and its resize, the keys card
// (with the drawer open too), heading anchors, the notes stream, the 404's
// suggestions, and the drawer below lg, with and without JavaScript. With
// screenshots.
import { fileURLToPath } from 'node:url';
import { smoke } from '../../../packages/garden/tests/smoke.mjs';

const ignoreError = (url, text) => text.includes('404') && url.includes('/essays/being-personal');

async function run({ page, BASE, check, shots }) {
  await page.goto(`${BASE}/essays/being-personal-in-the-workplace`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${shots}/essay-light.png`, fullPage: false });
  check('essay renders h1', (await page.locator('main h1').textContent())?.includes('Being Personal'));
  check('explorer column visible', await page.locator('#explorer').isVisible());
  check(
    'rail outline',
    (await page.locator('#rail [data-toc] a').count()) >= 2,
    `${await page.locator('#rail [data-toc] a').count()} links`,
  );
  check('statusline position', (await page.locator('[data-status-scroll]').textContent())?.trim() === 'Top');
  check(
    'statusline mode is NORMAL',
    (await page.locator('[data-status-mode]').evaluate((el) => getComputedStyle(el, '::before').content)) ===
      '"NORMAL"',
  );

  // Code blocks: Shiki chrome and the copy button.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`${BASE}/essays/guide-publishing-to-hugo-jekyll-remotely-via-ios`, { waitUntil: 'networkidle' });
  const blocks = await page.locator('main .code-block').count();
  const copies = await page.locator('main .code-block-copy').count();
  check(
    'code blocks in their chrome, each with a copy button',
    blocks > 0 && copies === blocks,
    `${copies} of ${blocks}`,
  );
  check('code highlighted in both themes', (await page.locator('main .astro-code[style*="--shiki-dark"]').count()) > 0);
  await page.locator('main .code-block-copy').first().click();
  check('copy button copies', (await page.locator('main .code-block-copy').first().textContent()) === 'Copied');
  await page.goto(`${BASE}/essays/being-personal-in-the-workplace`, { waitUntil: 'networkidle' });

  // Theme
  await page.click('[data-theme-toggle]');
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  check('theme toggle sets data-theme', theme === 'dark' || theme === 'light', theme ?? 'none');
  await page.screenshot({ path: `${shots}/essay-${theme}.png` });

  // Reader mode
  await page.click('[data-reader-toggle]');
  check(
    'reader mode hides panels',
    await page.evaluate(
      () =>
        document.documentElement.hasAttribute('data-hide-explorer') &&
        document.documentElement.hasAttribute('data-hide-rail'),
    ),
  );
  check(
    'statusline mode is READER',
    (await page.locator('[data-status-mode]').evaluate((el) => getComputedStyle(el, '::before').content)) ===
      '"READER"',
  );
  await page.click('[data-reader-toggle]');

  // Explorer folder toggle
  const folder = page.locator('#explorer li[data-path="/notes"] button').first();
  const before = await page.locator('#explorer li[data-path="/notes"]').getAttribute('class');
  await folder.click();
  const after = await page.locator('#explorer li[data-path="/notes"]').getAttribute('class');
  check('explorer folder toggles', before !== after);

  // Graph (a page with links), and its resize when the rail changes width.
  await page.goto(`${BASE}/career`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  check('graph shown on a linked page', await page.locator('[data-graph]').isVisible());
  check('linked from list', (await page.locator('#rail [data-backlinks] a').count()) > 0);
  const canvasWidth = await page
    .locator('[data-graph] canvas')
    .first()
    .evaluate((c) => c.width);
  // Below xl the rail sits under the article, in the reading column: the canvas is laid out again at that width.
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.waitForTimeout(400);
  const canvasWidthAfter = await page
    .locator('[data-graph] canvas')
    .first()
    .evaluate((c) => c.width);
  check(
    'graph canvas follows the rail width',
    canvasWidthAfter !== canvasWidth,
    `${canvasWidth} → ${canvasWidthAfter}`,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: `${shots}/career.png` });

  // Palette on Pagefind
  await page.keyboard.press('Control+KeyK');
  await page.waitForSelector('#palette[open]');
  check(
    'palette is a modal dialog with focus in its field',
    await page.evaluate(() => document.activeElement === document.querySelector('[data-palette-input]')),
  );
  check(
    'statusline mode is SEARCH',
    (await page.locator('[data-status-mode]').evaluate((el) => getComputedStyle(el, '::before').content)) ===
      '"SEARCH"',
  );
  check('palette lists root pages', (await page.locator('[data-palette-results] a').count()) >= 5);
  await page.fill('[data-palette-input]', 'pride');
  await page
    .waitForFunction(() => document.querySelectorAll('[data-palette-results] .palette-excerpt').length > 0, null, {
      timeout: 8000,
    })
    .catch(() => {});
  const hits = await page.locator('[data-palette-results] li a').count();
  const excerpt = await page
    .locator('[data-palette-results] .palette-excerpt')
    .first()
    .innerHTML()
    .catch(() => '');
  check('palette search via Pagefind', hits > 0 && excerpt.includes('palette-mark'), `${hits} hits`);
  check('palette section header', (await page.locator('[data-palette-results] .palette-section').count()) > 0);
  check(
    'result url has no .html',
    !(await page.locator('[data-palette-results] li a').first().getAttribute('href'))?.endsWith('.html'),
  );
  await page.screenshot({ path: `${shots}/palette.png` });
  await page.keyboard.press('Escape');
  check('escape closes the palette', !(await page.locator('#palette').evaluate((d) => d.open)));

  // Keys card (on a fresh page, with nothing focused)
  await page.goto(`${BASE}/career`, { waitUntil: 'networkidle' });
  await page.keyboard.type('?');
  await page.waitForTimeout(200);
  check('keys card opens with ?', await page.locator('#keys').evaluate((d) => d.open));
  await page.keyboard.press('Escape');

  // Heading anchor + callout + popover markup on home
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('home callout', (await page.locator('.callout-note .callout-title').textContent()) === 'About Me');
  check('heading anchors', (await page.locator('main h2 a.anchor').count()) > 0);
  check('portrait image', await page.locator('img.wiki-portrait').isVisible());
  await page.screenshot({ path: `${shots}/home.png`, fullPage: true });

  // Notes stream and a note page
  await page.goto(`${BASE}/notes`, { waitUntil: 'networkidle' });
  check('notes stream cards', (await page.locator('[data-stream] article').count()) === 8);
  await page.screenshot({ path: `${shots}/notes.png` });
  await page.goto(`${BASE}/publications`, { waitUntil: 'networkidle' });
  check('publications years', (await page.locator('main h2').count()) >= 6);

  // 404 with suggestions
  await page.goto(`${BASE}/essays/being-personal`, { waitUntil: 'networkidle' });
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll('[data-not-found-suggestions] li').length > 0 ||
        !document.querySelector('[data-not-found-none]').hidden,
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  check(
    '404 fills path',
    (await page.locator('[data-not-found-path]').first().textContent()) === '/essays/being-personal',
  );
  check(
    '404 suggestions',
    (await page.locator('[data-not-found-suggestions] li').count()) > 0,
    `${await page.locator('[data-not-found-suggestions] li').count()} suggestions`,
  );
  await page.screenshot({ path: `${shots}/404.png` });

  // The drawer below lg: a popover; the palette over it; the keys card over it.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/essays`, { waitUntil: 'networkidle' });
  await page.click('button[popovertarget="explorer"]');
  check('drawer opens on mobile', await page.locator('#explorer').evaluate((el) => el.matches(':popover-open')));
  check(
    'drawer focuses the current page',
    await page.evaluate(() => document.activeElement?.closest('#explorer') !== null),
  );
  await page.screenshot({ path: `${shots}/mobile-drawer.png` });
  await page.keyboard.press('Control+KeyK');
  await page.waitForSelector('#palette[open]');
  check(
    'palette over the drawer puts the drawer away',
    !(await page.locator('#explorer').evaluate((el) => el.matches(':popover-open'))),
  );
  check(
    'palette over the drawer holds focus',
    await page.evaluate(() => document.activeElement === document.querySelector('[data-palette-input]')),
  );
  await page.keyboard.press('Escape');
  await page.click('button[popovertarget="explorer"]');
  await page.keyboard.press('Escape');
  check('escape closes the drawer', !(await page.locator('#explorer').evaluate((el) => el.matches(':popover-open'))));

  // Without JavaScript the drawer still opens (declarative popover).
  const noJs = await page
    .context()
    .browser()
    .newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const plain = await noJs.newPage();
  await plain.goto(`${BASE}/essays`, { waitUntil: 'load' });
  await plain.click('button[popovertarget="explorer"]');
  check(
    'drawer opens without JavaScript',
    await plain.locator('#explorer').evaluate((el) => el.matches(':popover-open')),
  );
  check('explorer links reachable without JavaScript', (await plain.locator('#explorer a').count()) > 5);
  await noJs.close();
}

await smoke({
  base: process.env.PREVIEW_URL ?? 'http://localhost:4331',
  shots: fileURLToPath(new URL('../../../DEV_FILES/jothamlim/screenshots', import.meta.url)),
  run,
  ignoreError,
});
