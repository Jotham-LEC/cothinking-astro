// Which site a script works on: SITE (from the npm script) names the site's
// folder (sites/$SITE) and its local review files (DEV_FILES/$SITE).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITES = ['jothamlim', 'cothinking'];
export const SITE = process.env.SITE ?? '';
if (!SITES.includes(SITE)) throw new Error(`Set SITE to one of ${SITES.join(', ')} (got "${SITE}").`);
export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = path.join(REPO, 'sites', SITE);
export const DEV = path.join(REPO, 'DEV_FILES', SITE);
