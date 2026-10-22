// Where the project is on disk, for the few build-time reads outside Vite's
// reach (public/ files to measure, the TTFs for the share cards). A bundled
// module's import.meta.url points into dist/, so astro.config.mjs hands the
// root over as `import.meta.env.PROJECT_ROOT`; plain Node (the tests, the
// scripts) runs from the project root.
import path from 'node:path';

export const projectRoot: string = (import.meta.env ? import.meta.env.PROJECT_ROOT : undefined) ?? process.cwd();
export const publicDir = path.join(projectRoot, 'public');
