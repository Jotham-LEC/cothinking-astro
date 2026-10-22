// @ts-check
import { gardenConfig } from '../../packages/garden/config.mjs';
import { site as otherSite } from '../cothinking/src/site.config.ts';
import { site } from './src/site.config.ts';

export default gardenConfig({ root: new URL('.', import.meta.url), site, otherSite });
