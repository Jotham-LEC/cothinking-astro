// @ts-check
import { gardenConfig } from '../../packages/garden/config.mjs';

export default gardenConfig({ root: new URL('.', import.meta.url) });
