// The smoke test's runner: a browser against a site's `astro preview`
// (sites/<site>/tests/smoke.mjs gives the steps, the address and where the
// screenshots go). Any console error fails the run. Needs Playwright's
// browsers: PLAYWRIGHT_BROWSERS_PATH (nixpkgs' playwright-driver.browsers).
import fs from 'node:fs';
import { chromium } from 'playwright';

/**
 * @param {{ base: string, shots: string, run: Function, ignoreError?: (url: string, text: string) => boolean }} options
 */
export async function smoke({ base, shots, run, ignoreError = () => false }) {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !ignoreError(page.url(), m.text())) errors.push(`${page.url()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
  };

  await run({ page, BASE: base, check, shots });

  await browser.close();
  console.log(results.join('\n'));
  console.log(errors.length ? `\nConsole errors:\n${errors.join('\n')}` : '\nNo console errors.');
  process.exit(results.some((r) => r.startsWith('FAIL')) || errors.length ? 1 : 0);
}
