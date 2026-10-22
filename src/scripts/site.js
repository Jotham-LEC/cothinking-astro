/*! Adapted from Laradocs (https://github.com/petebishwhip/laradocs), Copyright (c) Pete Bishop, MIT License: see src/scripts/LICENSE-laradocs.md */
// Every page's behaviour, one feature a file in src/scripts/site/, started
// once the page has loaded.
import { initTheme } from './site/theme';
import { initPanels } from './site/panels';
import { initCodeBlocks } from './site/code-blocks';
import { initDrawer } from './site/drawer';
import { initScrollSpy } from './site/scroll-spy';
import { initProgress } from './site/progress';
import { initZoom } from './site/zoom';
import { initExplorer } from './site/explorer';
import { initPalette } from './site/palette';
import { initKeys, initSearchKbdHint } from './site/keys';
import { initPopovers } from './site/popovers';
import { initHeadingLinks } from './site/heading-links';

function boot() {
  initTheme();
  initPanels();
  initCodeBlocks();
  const closeDrawer = initDrawer();
  initScrollSpy();
  initProgress();
  initZoom();
  initExplorer();
  const openPalette = initPalette(closeDrawer);
  initKeys(openPalette);
  initSearchKbdHint();
  initPopovers();
  initHeadingLinks();
}

if (document.readyState !== 'loading') {
  boot();
} else {
  document.addEventListener('DOMContentLoaded', boot);
}
