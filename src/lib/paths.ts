// Where the project is on disk, for the few build-time reads outside Vite's
// reach (public/ files to measure, the TTFs for the share cards). Astro runs
// from the project root, and a bundled module's import.meta.url points into
// dist/, so the working directory is the one stable answer.
import path from 'node:path';

export const projectRoot = process.cwd();
export const publicDir = path.join(projectRoot, 'public');
