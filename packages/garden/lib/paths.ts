// Where the site and the garden are on disk, for the few build-time reads
// outside Vite's reach (public/ files to measure, the TTFs for the share
// cards). A bundled module's import.meta.url points into dist/, so
// garden/config.mjs hands the folders over as `import.meta.env.PROJECT_ROOT`
// and `GARDEN_ROOT`; plain Node (the tests, the scripts) gets the site from
// the working folder, and the garden from this file's place.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const env = import.meta.env as ImportMetaEnv | undefined;
export const projectRoot: string = env?.PROJECT_ROOT ?? process.cwd();
export const gardenRoot: string = env?.GARDEN_ROOT ?? fileURLToPath(new URL('..', import.meta.url));
export const publicDir = path.join(projectRoot, 'public');
