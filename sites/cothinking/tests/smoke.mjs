// cothink.ing's smoke steps (`npm run smoke`, against `astro preview` on
// PREVIEW_URL, else :4332): the rooms (terminal ground, no rail, the drawer
// at every width, with and without JavaScript), the panels starting open
// and reader mode, the wiki's categories and its section-wide graph, the
// series and wiki pager, Copy as Markdown, the Pagefind palette and the 404's suggestions, with
// screenshots of rooms and garden pages in light and dark.
import { fileURLToPath } from 'node:url';
import { smoke } from '../../../packages/garden/tests/smoke.mjs';

const ignoreError = (url, text) => text.includes('404') && url.includes('/wiki/dmarc');

async function both(page, shots, name) {
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${shots}/${name}-${theme}.png` });
  }
}

async function run({ page, BASE, check, shots }) {
  // A room: the home page.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check('home h1', (await page.locator('main h1').textContent())?.includes('Web, IT and marketing'));
  check(
    'home is a room',
    await page.evaluate(
      () =>
        document.querySelector('.shell')?.hasAttribute('data-room') && document.body.classList.contains('bg-terminal'),
    ),
  );
  check('a room has no rail', (await page.locator('#rail').count()) === 0);
  check('work tiles', (await page.locator('main ul li img[width="800"]').count()) === 3);
  await both(page, shots, 'home');

  // The drawer opens in a room at a desktop width (lg; the menu button goes at xl).
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.click('button[popovertarget="explorer"]');
  check('room drawer opens at lg', await page.locator('#explorer').evaluate((el) => el.matches(':popover-open')));
  check('room drawer lists the menu', (await page.locator('[data-drawer-menu] a').count()) >= 5);
  await page.screenshot({ path: `${shots}/home-drawer.png` });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 900 });

  // A case study, a room with a resized screenshot.
  await page.goto(`${BASE}/work/ultimate-circle`, { waitUntil: 'networkidle' });
  check(
    'case study screenshot loads',
    await page.locator('main img[fetchpriority="high"]').evaluate((i) => i.complete && i.naturalWidth > 0),
  );
  await both(page, shots, 'case-study');

  // A garden page: the panels start open; reader mode puts both away.
  await page.goto(`${BASE}/wiki`, { waitUntil: 'networkidle' });
  check(
    'explorer starts open',
    !(await page.evaluate(() => document.documentElement.hasAttribute('data-hide-explorer'))),
  );
  check('explorer column visible', await page.locator('#explorer').isVisible());
  await page.click('[data-reader-toggle]');
  check(
    'reader mode hides panels',
    await page.evaluate(
      () =>
        document.documentElement.hasAttribute('data-hide-explorer') &&
        document.documentElement.hasAttribute('data-hide-rail'),
    ),
  );
  await page.click('[data-reader-toggle]');
  check('wiki categories', (await page.locator('main article h2[id]').count()) === 6);
  await page.locator('#rail').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  check('wiki graph shown', await page.locator('[data-graph]').isVisible());
  check(
    'wiki graph legend names the wiki',
    (await page.locator('[data-graph] ul li').allTextContents()).some((t) => t.includes('wiki')),
  );
  await both(page, shots, 'wiki');

  // A series' pager, and the byline.
  await page.goto(`${BASE}/wiki/boring-office-part-2-the-keys`, { waitUntil: 'networkidle' });
  check(
    'series pager previous',
    (await page.locator('main a[rel="prev"]').getAttribute('href')) === '/wiki/boring-office-part-1-overview',
  );
  check(
    'series pager next',
    (await page.locator('main a[rel="next"]').getAttribute('href')) === '/wiki/boring-office-part-3-password-managers',
  );
  check('byline', (await page.locator('main a[rel="author"]').textContent())?.trim() === 'Jotham Lim');
  // Past a series' first part, the pager walks on through the wiki in the Explorer's order.
  await page.goto(`${BASE}/wiki/boring-office-part-1-overview`, { waitUntil: 'networkidle' });
  check(
    'wiki pager leaves the series',
    (await page.locator('main a[rel="prev"]').getAttribute('href')) === '/wiki/website-ownership-checklist',
  );
  // Copy as Markdown puts the page's Markdown copy on the clipboard.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const copy = page.locator('[data-copy-markdown]');
  check('copy as markdown shown', await copy.isVisible());
  await copy.click();
  await page.waitForFunction(() => document.querySelector('[data-copy-markdown]')?.textContent?.trim() === 'Copied');
  check(
    'copy as markdown copies',
    (await page.evaluate(() => navigator.clipboard.readText())).startsWith(
      '# Setting up IT for a small company, Part 1: The Boring Office',
    ),
  );
  await page.goto(`${BASE}/wiki/boring-office-part-3-password-managers`, { waitUntil: 'networkidle' });
  check(
    'light and dark diagram pair',
    (await page.locator('main img.wiki-logo-light').count()) >= 1 &&
      (await page.locator('main img.wiki-logo-dark').count()) >= 1,
  );
  await both(page, shots, 'wiki-entry');

  // A problem page: the offer under the title.
  await page.goto(`${BASE}/emails-going-to-spam`, { waitUntil: 'networkidle' });
  check('problem offer', await page.locator('#i-can-do-this').isVisible());
  check(
    'enquiry links name the page',
    (await page.locator('#next-step a[href^="mailto:"]').getAttribute('href'))?.includes('Emails%20going%20to%20spam'),
  );

  // Palette on Pagefind.
  await page.keyboard.press('Control+KeyK');
  await page.waitForSelector('#palette[open]');
  await page.fill('[data-palette-input]', 'dmarc');
  await page
    .waitForFunction(() => document.querySelectorAll('[data-palette-results] .palette-excerpt').length > 0, null, {
      timeout: 8000,
    })
    .catch(() => {});
  check('palette search via Pagefind', (await page.locator('[data-palette-results] li a').count()) > 0);
  await page.keyboard.press('Escape');

  // 404 with suggestions.
  await page.goto(`${BASE}/wiki/dmarc`, { waitUntil: 'networkidle' });
  await page
    .waitForFunction(() => document.querySelectorAll('[data-not-found-suggestions] li').length > 0, null, {
      timeout: 8000,
    })
    .catch(() => {});
  check('404 suggestions', (await page.locator('[data-not-found-suggestions] li').count()) > 0);
  await page.screenshot({ path: `${shots}/404.png` });

  // The drawer on a garden page below lg; the keys card over it.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/wiki/speed-to-lead`, { waitUntil: 'networkidle' });
  await page.click('button[popovertarget="explorer"]');
  check('drawer opens on mobile', await page.locator('#explorer').evaluate((el) => el.matches(':popover-open')));
  await page.screenshot({ path: `${shots}/mobile-drawer.png` });
  await page.keyboard.press('Escape');
  await page.keyboard.type('?');
  await page.waitForTimeout(200);
  check('keys card opens after the drawer', await page.locator('#keys').evaluate((d) => d.open));
  check(
    'keys card over the drawer leaves it closed',
    !(await page.locator('#explorer').evaluate((el) => el.matches(':popover-open'))),
  );
  await page.keyboard.press('Escape');

  // Without JavaScript the room's drawer still opens (declarative popover).
  const noJs = await page
    .context()
    .browser()
    .newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const plain = await noJs.newPage();
  await plain.goto(`${BASE}/`, { waitUntil: 'load' });
  await plain.click('button[popovertarget="explorer"]');
  check(
    'room drawer opens without JavaScript',
    await plain.locator('#explorer').evaluate((el) => el.matches(':popover-open')),
  );
  check('menu links reachable without JavaScript', (await plain.locator('[data-drawer-menu] a').count()) >= 5);
  await noJs.close();
}

await smoke({
  base: process.env.PREVIEW_URL ?? 'http://localhost:4332',
  shots: fileURLToPath(new URL('../../../DEV_FILES/cothinking/screenshots', import.meta.url)),
  run,
  ignoreError,
});
