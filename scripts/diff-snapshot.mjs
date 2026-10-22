#!/usr/bin/env node
// `node scripts/diff-snapshot.mjs <before.json> <after.json> [--allow allow.txt]`:
// compares two snapshots (scripts/snapshot.mjs) and prints every difference.
// An allow file lists the differences a change was meant to make, one a line:
// `<url-glob> <field>` for a page's field (`/essays/* headings`, `/** ogImage`),
// or `feeds`, `sitemap`, `graph`, `robots`, `llms`, `files` for the whole
// thing. Anything not listed fails the run (exit 1). The sets of pages must
// match exactly.
import fs from 'node:fs';

const args = process.argv.slice(2);
const allowAt = args.indexOf('--allow');
const allowFile = allowAt === -1 ? null : args[allowAt + 1];
const [beforeFile, afterFile] = allowAt === -1 ? args : args.filter((a, i) => i !== allowAt && i !== allowAt + 1);
if (!beforeFile || !afterFile) {
  console.error('Usage: node scripts/diff-snapshot.mjs <before.json> <after.json> [--allow allow.txt]');
  process.exit(2);
}
const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
const after = JSON.parse(fs.readFileSync(afterFile, 'utf8'));

const rules = (allowFile ? fs.readFileSync(allowFile, 'utf8').split('\n') : [])
  .map((l) => l.replace(/#.*/, '').trim())
  .filter(Boolean)
  .map((l) => l.split(/\s+/));

const globRe = (glob) =>
  new RegExp(
    '^' +
      glob
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '\u0000')
        .replace(/\*/g, '[^/]*')
        .replace(/\u0000/g, '.*') +
      '$',
  );
const allowed = (url, field) =>
  rules.some(([a, b]) => (b === undefined ? a === field && url === null : globRe(a).test(url ?? '') && b === field));

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const show = (v) => {
  const s = JSON.stringify(v);
  return s === undefined ? 'undefined' : s.length > 300 ? s.slice(0, 300) + '…' : s;
};

let failures = 0;
let allowedCount = 0;
const report = (url, field, a, b) => {
  if (allowed(url, field)) {
    allowedCount++;
    return;
  }
  failures++;
  console.log(`✗ ${url ?? ''} ${field}\n    before: ${show(a)}\n    after:  ${show(b)}`);
};

// Pages: the set, then each field.
const urlsBefore = Object.keys(before.pages).sort();
const urlsAfter = Object.keys(after.pages).sort();
for (const u of urlsBefore) if (!(u in after.pages)) report(u, 'missing', 'present', 'missing');
for (const u of urlsAfter) if (!(u in before.pages)) report(u, 'added', 'missing', 'present');
for (const url of urlsBefore) {
  const a = before.pages[url];
  const b = after.pages[url];
  if (!b) continue;
  for (const field of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!same(a[field], b[field])) report(url, field, a[field], b[field]);
  }
}

// The rest, whole.
for (const key of ['feeds', 'sitemap', 'graph', 'robots', 'llms', 'files']) {
  if (!same(before[key], after[key])) report(null, key, before[key], after[key]);
}

console.log(
  `${urlsBefore.length} → ${urlsAfter.length} pages; ${failures} unexpected difference${failures === 1 ? '' : 's'}, ${allowedCount} allowed.`,
);
process.exit(failures ? 1 : 0);
