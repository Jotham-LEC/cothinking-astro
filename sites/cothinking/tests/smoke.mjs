// cothink.ing's smoke steps (`npm run smoke`, against `astro preview` on PREVIEW_URL, else :4332): the rooms (terminal
// ground, no rail, the drawer at every width), the panels starting open and reader mode,
// the wiki's categories and its section-wide graph, the series pager, the
// Pagefind palette and the 404's suggestions, with screenshots of rooms and
// garden pages in light and dark.
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
      () => document.body.hasAttribute('data-room') && document.body.classList.contains('bg-terminal'),
    ),
  );
  check('a room has no rail', (await page.locator('[data-rail]').count()) === 0);
  check('work tiles', (await page.locator('main ul li img[width="800"]').count()) === 3);
  await both(page, shots, 'home');

  // The drawer opens in a room at a desktop width (lg; the menu button goes at xl).
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.click('[data-menu]');
  check('room drawer opens at lg', await page.evaluate(() => document.body.classList.contains('nav-open')));
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
  check('explorer visible', await page.locator('[data-explorer]').isVisible());
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
  await page.locator('[data-rail]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  check('wiki graph shown', await page.locator('[data-graph]').isVisible());
  check(
    'wiki graph legend names the wiki',
    (await page.locator('[data-graph] ul li').allTextContents()).some((t) => t.includes('wiki')),
  );
  await both(page, shots, 'wiki');

  // A series' pager.
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
  await page.waitForSelector('[data-palette]:not([hidden])');
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

  // Mobile drawer on a garden page.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/wiki/speed-to-lead`, { waitUntil: 'networkidle' });
  await page.click('[data-menu]');
  check('drawer opens on mobile', await page.evaluate(() => document.body.classList.contains('nav-open')));
  await page.screenshot({ path: `${shots}/mobile-drawer.png` });
}

await smoke({
  base: process.env.PREVIEW_URL ?? 'http://localhost:4332',
  shots: fileURLToPath(new URL('../../../DEV_FILES/cothinking/screenshots', import.meta.url)),
  run,
  ignoreError,
});
