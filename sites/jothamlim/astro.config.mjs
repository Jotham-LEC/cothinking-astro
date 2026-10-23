// @ts-check
// Relative paths, not @garden/@site: this file is what sets Vite up, so the
// tsconfig aliases do not exist yet when it loads.
import { gardenConfig } from '../../packages/garden/config.mjs';
import { site as otherSite } from '../cothinking/src/site.config.ts';
import { site } from './src/site.config.ts';

export default gardenConfig({ root: new URL('.', import.meta.url), site, otherSite });
