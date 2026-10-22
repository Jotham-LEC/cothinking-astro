#!/usr/bin/env node
// `npm run smoke:<site>`: a browser run against the site's `astro preview`
// (PREVIEW_URL, else :4321; Astro 7's preview is a background server:
// `astro preview status` prints its address). The steps are the site's
// (tests/smoke/<site>.mjs); screenshots go under DEV_FILES/<site>/screenshots/,
// and any console error fails the run. Needs Playwright's browsers:
// PLAYWRIGHT_BROWSERS_PATH (nixpkgs' playwright-driver.browsers).
import fs from 'node:fs';
import { chromium } from 'playwright';

const SITE = process.env.SITE ?? 'jothamlim';
const { run, ignoreError } = await import(`./smoke/${SITE}.mjs`);
const BASE = process.env.PREVIEW_URL ?? 'http://localhost:4321';
const shots = `DEV_FILES/${SITE}/screenshots`;
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

await run({ page, BASE, check, shots });

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `\nConsole errors:\n${errors.join('\n')}` : '\nNo console errors.');
process.exit(results.some((r) => r.startsWith('FAIL')) || errors.length ? 1 : 0);
