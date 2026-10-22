// @ts-check
import { gardenConfig } from '../../garden/config.mjs';

export default gardenConfig({ root: new URL('.', import.meta.url) });
