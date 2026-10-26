// Tabs in the page's text (`:::tabs`: lib/markdown/remark-directives.ts
// writes a `.tab-panel` per tab, its `.tab-label` first). Without JS every
// panel shows under its label; with it, the labels become a tab list and one
// panel shows. The keys are the ARIA tabs pattern's: the arrows, Home and End
// move between the tabs and select as they go, Tab moves into the panel. A
// hidden panel is `until-found`, so the browser's find opens its tab.

/** One set of tabs: its tab buttons and their panels, in order. */
type Tabs = { tabs: HTMLButtonElement[]; panels: HTMLElement[] };

function select(state: Tabs, i: number, focus = false) {
  state.tabs.forEach((tab, j) => {
    tab.setAttribute('aria-selected', String(i === j));
    tab.tabIndex = i === j ? 0 : -1;
    state.panels[j]!.tabIndex = i === j ? 0 : -1;
    if (i === j) state.panels[j]!.removeAttribute('hidden');
    else state.panels[j]!.setAttribute('hidden', 'until-found');
  });
  if (focus) state.tabs[i]!.focus();
}

function onKeydown(state: Tabs, e: KeyboardEvent) {
  const i = state.tabs.indexOf(e.target as HTMLButtonElement);
  const last = state.tabs.length - 1;
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: last }[e.key];
  if (i < 0 || to === undefined) return;
  e.preventDefault();
  select(state, to > last ? 0 : to < 0 ? last : to, true);
}

export function initTabs() {
  document.querySelectorAll<HTMLElement>('.tabs:not(.is-tabbed)').forEach((box, n) => {
    const panels = [...box.querySelectorAll<HTMLElement>(':scope > .tab-panel')];
    if (!panels.length) return;
    const list = document.createElement('div');
    list.className = 'tab-list';
    list.setAttribute('role', 'tablist');
    const state: Tabs = { tabs: [], panels };
    panels.forEach((panel, i) => {
      const label = panel.querySelector<HTMLElement>(':scope > .tab-label');
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tab';
      tab.id = `tabs-${n}-tab-${i}`;
      tab.textContent = label?.textContent ?? `Tab ${i + 1}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', (panel.id = `tabs-${n}-panel-${i}`));
      tab.addEventListener('click', () => select(state, i));
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.addEventListener('beforematch', () => select(state, i));
      if (label) label.hidden = true;
      state.tabs.push(tab);
      list.append(tab);
    });
    list.addEventListener('keydown', (e) => onKeydown(state, e));
    box.prepend(list);
    box.classList.add('is-tabbed');
    select(state, 0);
  });
}
