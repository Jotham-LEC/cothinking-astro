// jothamlim.com's smoke steps (tests/smoke.mjs runs them): console errors,
// theme toggle, code-block chrome, the Pagefind palette, Explorer folders, the
// graph, the keys card, heading anchors, the notes stream and the 404's
// suggestions, with screenshots.
export const ignoreError = (url, text) => text.includes('404') && url.includes('/essays/being-personal');

export async function run({ page, BASE, check, shots }) {
  await page.goto(`${BASE}/essays/being-personal-in-the-workplace`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${shots}/essay-light.png`, fullPage: false });
  check('essay renders h1', (await page.locator('main h1').textContent())?.includes('Being Personal'));
  check('explorer visible', await page.locator('[data-explorer]').isVisible());
  check(
    'rail outline',
    (await page.locator('[data-rail] [data-toc] a').count()) >= 2,
    `${await page.locator('[data-rail] [data-toc] a').count()} links`,
  );
  check('statusline read time', (await page.locator('[data-status-scroll]').textContent())?.trim() === 'Top');

  // Code-block chrome, on an essay with fenced code
  await page.goto(`${BASE}/essays/guide-publishing-to-hugo-jekyll-remotely-via-ios`, { waitUntil: 'networkidle' });
  const blocks = await page.locator('main pre').count();
  const copies = await page.locator('main .code-block-copy').count();
  check('code blocks get a copy button', blocks > 0 && copies === blocks, `${copies} of ${blocks}`);
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
  await page.click('[data-reader-toggle]');

  // Explorer folder toggle
  const folder = page.locator('[data-explorer] li[data-path="/notes"] button').first();
  const before = await page.locator('[data-explorer] li[data-path="/notes"]').getAttribute('class');
  await folder.click();
  const after = await page.locator('[data-explorer] li[data-path="/notes"]').getAttribute('class');
  check('explorer folder toggles', before !== after);

  // Graph (a page with links)
  await page.goto(`${BASE}/career`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  check('graph shown on a linked page', await page.locator('[data-graph]').isVisible());
  check('linked from list', (await page.locator('[data-backlinks] a').count()) > 0);
  await page.screenshot({ path: `${shots}/career.png` });

  // Palette on Pagefind
  await page.keyboard.press('Control+KeyK');
  await page.waitForSelector('[data-palette]:not([hidden])');
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

  // Keys card (on a fresh page, with nothing focused)
  await page.goto(`${BASE}/career`, { waitUntil: 'networkidle' });
  await page.keyboard.type('?');
  await page.waitForTimeout(200);
  check('keys card opens with ?', await page.locator('[data-keys]').evaluate((d) => d.open));
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

  // Mobile drawer
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/essays`, { waitUntil: 'networkidle' });
  await page.click('[data-menu]');
  check('drawer opens on mobile', await page.evaluate(() => document.body.classList.contains('nav-open')));
  await page.screenshot({ path: `${shots}/mobile-drawer.png` });
}
