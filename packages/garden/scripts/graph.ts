// The local graph in the rail (components/Rail.astro), after Quartz: this
// page and the pages one link away, laid out by d3-force on a canvas, which
// can be zoomed, panned, pulled about and opened larger in a dialog. Nodes
// link to their pages; the section hides itself when the page has no
// neighbours, since a lone dot says nothing. Each node takes its section's
// colour (a legend under the canvas names them); the current page is larger
// and ringed. Colours come from the site's tokens, read off probe elements
// so light and dark mode both apply.
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from 'd3-force';

type Node = { id: string; title: string; url: string; section: string; section_title: string };
type Link = { source: string; target: string };
type Data = { nodes: Node[]; links: Link[] };
type SimNode = Node & SimulationNodeDatum;
type SimLink = { source: SimNode; target: SimNode };
type Local = { current: Node; nodes: SimNode[]; links: { source: string; target: string }[] };

/** A colour token (a collection's `graphColour`) → the utility that carries its colour, written out in full so Tailwind generates them. */
const COLOURS: Record<string, string> = {
  1: 'text-graph-1',
  2: 'text-graph-2',
  3: 'text-graph-3',
  4: 'text-graph-4',
  5: 'text-graph-5',
};
/** The site's own pages (no section, or a section without a colour). */
const PAGES = '5';

function colorOf(className: string): string {
  const probe = document.createElement('span');
  probe.className = className;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** The page and its neighbours one link away; with `section`, every page of that section too, each tied to the current one. */
function neighbourhood(data: Data, url: string, section: string | null): Local | null {
  const current = data.nodes.find((node) => node.url === url);
  if (!current) return null;
  const near = new Set([current.id]);
  for (const link of data.links) {
    if (link.source === current.id) near.add(link.target);
    if (link.target === current.id) near.add(link.source);
  }
  const members = section ? data.nodes.filter((node) => node.section === section).map((node) => node.id) : [];
  for (const id of members) near.add(id);
  if (near.size < 2) return null;
  const links = data.links.filter((link) => near.has(link.source) && near.has(link.target));
  const tied = new Set(
    links.flatMap((link) =>
      link.source === current.id || link.target === current.id ? [link.source, link.target] : [],
    ),
  );
  return {
    current,
    nodes: data.nodes.filter((node) => near.has(node.id)).map((node) => ({ ...node })),
    links: [...links, ...members.filter((id) => !tied.has(id)).map((id) => ({ source: current.id, target: id }))].map(
      (link) => ({ ...link }),
    ),
  };
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;

/** What the drawing and the pointer share: the canvas, the graph, how it is coloured, the view and the pointer's state. */
type GraphView = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  graph: Local;
  links: SimLink[];
  colourOf: (node: Node) => string;
  labels: 'hover' | 'all';
  colors: ReturnType<typeof palette>;
  transform: { k: number; x: number; y: number };
  hovered: SimNode | null;
  radius: (node: Node) => number;
  isCurrent: (node: Node) => boolean;
};

const palette = () => ({
  sections: Object.fromEntries(Object.entries(COLOURS).map(([token, className]) => [token, colorOf(className)])),
  link: colorOf('text-subtle'),
  ring: colorOf('text-heading'),
  label: colorOf('text-fg'),
});

/** The force layout, spread in proportion to the canvas (the rail's is about 270px), with room for a label under every page when all are named. */
function createSimulation(view: GraphView, onTick: () => void) {
  const spread = Math.max(1, Math.min(view.width, view.height) / 270);
  return forceSimulation(view.graph.nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(view.links)
        .id((node) => node.id)
        .distance(45 * spread),
    )
    .force('charge', forceManyBody().strength(-120 * spread))
    .force('center', forceCenter(view.width / 2, view.height / 2))
    .force(
      'collide',
      forceCollide<SimNode>().radius((node) => view.radius(node) + (view.labels === 'all' ? 40 : 14)),
    )
    .on('tick', onTick);
}

/** One frame: the links, the nodes (the current and hovered ones ringed), then the labels. */
function drawGraph(view: GraphView) {
  const { ctx, transform, colors } = view;
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);
  ctx.lineWidth = 1 / transform.k;
  ctx.strokeStyle = colors.link;
  for (const link of view.links) {
    ctx.beginPath();
    ctx.moveTo(link.source.x!, link.source.y!);
    ctx.lineTo(link.target.x!, link.target.y!);
    ctx.stroke();
  }
  for (const node of view.graph.nodes) {
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, view.radius(node), 0, Math.PI * 2);
    ctx.fillStyle = colors.sections[view.colourOf(node)]!;
    ctx.fill();
    if (view.isCurrent(node) || node === view.hovered) {
      ctx.lineWidth = (view.isCurrent(node) ? 2 : 1) / transform.k;
      ctx.strokeStyle = colors.ring;
      ctx.stroke();
    }
  }
  // Labels keep their size on screen at any zoom.
  ctx.font = `${11 / transform.k}px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.label;
  for (const node of view.graph.nodes) {
    if (view.labels !== 'all' && node !== view.hovered && !view.isCurrent(node)) continue;
    const label = node.title.length > 28 ? `${node.title.slice(0, 27)}…` : node.title;
    ctx.fillText(label, node.x!, node.y! + view.radius(node) + 14 / transform.k);
  }
}

/** The pointer's state: the view it moves, the layout it pulls, and the press in progress (a page or the background). */
type Pointer = {
  view: GraphView;
  simulation: ReturnType<typeof createSimulation>;
  render: () => void;
  pressed: {
    node: SimNode | null;
    start: { x: number; y: number };
    transform: GraphView['transform'];
    moved: boolean;
  } | null;
};

/** Where a pointer event falls, in the canvas and in the graph. */
function point(view: GraphView, event: MouseEvent) {
  const rect = view.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y, gx: (x - view.transform.x) / view.transform.k, gy: (y - view.transform.y) / view.transform.k };
}

const nodeAt = (view: GraphView, p: { gx: number; gy: number }) =>
  view.graph.nodes.find(
    (node) => Math.hypot(node.x! - p.gx, node.y! - p.gy) <= view.radius(node) + 4 / view.transform.k,
  ) ?? null;

/** Zooms by `factor` about (x, y), the canvas's centre unless given, within MIN_ZOOM and MAX_ZOOM. */
function zoomAbout(state: Pointer, factor: number, x = state.view.width / 2, y = state.view.height / 2) {
  const { transform } = state.view;
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, transform.k * factor));
  state.view.transform = {
    k,
    x: x - ((x - transform.x) * k) / transform.k,
    y: y - ((y - transform.y) * k) / transform.k,
  };
  state.render();
}

function onWheel(state: Pointer, event: WheelEvent) {
  event.preventDefault();
  const p = point(state.view, event);
  zoomAbout(state, Math.exp(-event.deltaY * 0.002), p.x, p.y);
}

/** A press with the main button: on a page, pins it and wakes the layout; else starts a pan. */
function press(state: Pointer, event: PointerEvent) {
  if (event.button !== 0) return;
  const { view } = state;
  const p = point(view, event);
  const node = nodeAt(view, p);
  state.pressed = { node, start: p, transform: { ...view.transform }, moved: false };
  view.canvas.setPointerCapture(event.pointerId);
  if (node) {
    node.fx = node.x;
    node.fy = node.y;
    state.simulation.alphaTarget(0.3).restart();
  }
  view.canvas.style.cursor = 'grabbing';
}

/** While pressed, drags the page or pans the view; else marks the page under the pointer. */
function move(state: Pointer, event: PointerEvent) {
  const { view, pressed } = state;
  const p = point(view, event);
  if (pressed) {
    pressed.moved = pressed.moved || Math.hypot(p.x - pressed.start.x, p.y - pressed.start.y) > 4;
    if (pressed.node) {
      pressed.node.fx = p.gx;
      pressed.node.fy = p.gy;
    } else {
      view.transform = {
        ...pressed.transform,
        x: pressed.transform.x + p.x - pressed.start.x,
        y: pressed.transform.y + p.y - pressed.start.y,
      };
      state.render();
    }
    return;
  }
  const node = nodeAt(view, p);
  if (node !== view.hovered) {
    view.hovered = node;
    view.canvas.style.cursor = node ? 'pointer' : 'grab';
    view.canvas.title = node ? node.title : '';
    state.render();
  }
}

/** The end of a press: lets a dragged page go; a press on another page that did not move opens it. */
function release(state: Pointer, event: PointerEvent) {
  if (!state.pressed) return;
  const { view } = state;
  const { node, moved } = state.pressed;
  state.pressed = null;
  if (view.canvas.hasPointerCapture(event.pointerId)) view.canvas.releasePointerCapture(event.pointerId);
  view.canvas.style.cursor = view.hovered ? 'pointer' : 'grab';
  if (node) {
    node.fx = node.fy = null;
    state.simulation.alphaTarget(0);
    if (!moved && event.type === 'pointerup' && !view.isCurrent(node)) window.location.href = node.url;
  }
}

/** A double click on the background puts the view back. */
function reset(state: Pointer, event: MouseEvent) {
  if (nodeAt(state.view, point(state.view, event))) return;
  state.view.transform = { k: 1, x: 0, y: 0 };
  state.render();
}

function leave(state: Pointer) {
  if (!state.pressed && state.view.hovered) {
    state.view.hovered = null;
    state.render();
  }
}

/**
 * The pointer: the wheel (or zoomBy) zooms about the pointer, dragging the background pans (a double click there puts
 * the view back), dragging a page pins it while the others follow, and a press that does not move opens the page.
 * Only the main button drags or opens a page; a middle or right click is the browser's. Returns zoomBy.
 */
function bindPointer(
  view: GraphView,
  simulation: ReturnType<typeof createSimulation>,
  render: () => void,
  signal: AbortSignal,
) {
  const state: Pointer = { view, simulation, render, pressed: null };
  const on = <K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options: AddEventListenerOptions = {},
  ) => view.canvas.addEventListener(type, handler, { ...options, signal });
  on('wheel', (event) => onWheel(state, event), { passive: false });
  on('pointerdown', (event) => press(state, event));
  on('pointermove', (event) => move(state, event));
  on('pointerup', (event) => release(state, event));
  on('pointercancel', (event) => release(state, event));
  on('dblclick', (event) => reset(state, event));
  on('pointerleave', () => leave(state));
  view.canvas.style.cursor = 'grab';
  return (factor: number, x?: number, y?: number) => zoomAbout(state, factor, x, y);
}

/**
 * A graph drawn on a canvas (drawGraph), laid out by d3-force (createSimulation) and interactive (bindPointer).
 * `labels: 'all'` names every page (the dialog); else only the current page and the one under the pointer. Returns
 * zoomBy and destroy, which stops the simulation and drops the listeners.
 */
function createView(
  canvas: HTMLCanvasElement,
  graph: Local,
  colourOf: (node: Node) => string,
  { labels = 'hover' }: { labels?: 'hover' | 'all' } = {},
) {
  // The canvas's CSS size (the rail's is square, the dialog's fills it) at the screen's pixel density.
  const width = canvas.clientWidth || 272;
  const height = canvas.clientHeight || width;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const degree: Record<string, number> = {};
  for (const link of graph.links) {
    degree[link.source] = (degree[link.source] ?? 0) + 1;
    degree[link.target] = (degree[link.target] ?? 0) + 1;
  }
  const isCurrent = (node: Node) => node.id === graph.current.id;
  const view: GraphView = {
    canvas,
    ctx: canvas.getContext('2d')!,
    width,
    height,
    dpr,
    graph,
    links: graph.links.map((l) => ({ ...l })) as unknown as SimLink[],
    colourOf,
    labels,
    colors: palette(),
    transform: { k: 1, x: 0, y: 0 },
    hovered: null,
    radius: (node) => 4 + Math.min(6, degree[node.id] ?? 0) + (isCurrent(node) ? 3 : 0),
    isCurrent,
  };
  const render = () => drawGraph(view);
  const simulation = createSimulation(view, render);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    simulation.stop();
    for (let i = 0; i < 200; i++) simulation.tick();
    render();
  }
  const listeners = new AbortController();
  const zoomBy = bindPointer(view, simulation, render, listeners.signal);

  // New colours when the scheme changes: the header's toggle sets data-theme, and a reader following the system has the OS switch it.
  const recolor = () => {
    view.colors = palette();
    render();
  };
  const themes = new MutationObserver(recolor);
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const scheme = window.matchMedia('(prefers-color-scheme: dark)');
  scheme.addEventListener('change', recolor, { signal: listeners.signal });

  return {
    zoomBy,
    destroy() {
      simulation.stop();
      listeners.abort();
      themes.disconnect();
    },
  };
}

/** One dot and name per section present, so colour is not the only key. */
function legend(mount: HTMLElement, graph: Local, colourOf: (node: Node) => string) {
  const present = new Set(graph.nodes.map(colourOf));
  const titles = Object.fromEntries(graph.nodes.map((node) => [colourOf(node), node.section_title.toLowerCase()]));
  const list = document.createElement('ul');
  list.className = 'text-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs';
  for (const [token, className] of Object.entries(COLOURS)) {
    if (!present.has(token)) continue;
    const item = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = `${className} mr-1`;
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = '●';
    item.append(dot, (token !== PAGES && titles[token]) || 'pages');
    list.appendChild(item);
  }
  mount.appendChild(list);
}

/** The rail's graph, its zoom buttons, and the dialog that shows it larger with every page named (a fresh copy, laid out again at that size). */
function mountGraph(mount: HTMLElement, data: Data) {
  const sectionColours: Record<string, number> = JSON.parse(mount.dataset.graphColours ?? '{}');
  const colourOf = (node: Node) => {
    const token = String(sectionColours[node.section] ?? PAGES);
    return token in COLOURS ? token : PAGES;
  };
  const make = () => neighbourhood(data, mount.dataset.graph!, mount.dataset.graphSection ?? null);
  const graph = make();
  if (!graph) {
    mount.remove();
    return;
  }
  mount.hidden = false;

  const railCanvas = mount.querySelector<HTMLCanvasElement>('[data-graph-canvas]')!;
  const railFrame = railCanvas.parentElement!;
  let rail = createView(railCanvas, graph, colourOf);
  railFrame.querySelector('[data-graph-zoom-in]')!.addEventListener('click', () => rail.zoomBy(1.25));
  railFrame.querySelector('[data-graph-zoom-out]')!.addEventListener('click', () => rail.zoomBy(0.8));
  // The rail's width changes with the layout (reader mode, the window): lay the graph out again at the new size.
  let width = railCanvas.clientWidth;
  new ResizeObserver(() => {
    if (railCanvas.clientWidth === width || railCanvas.clientWidth === 0) return;
    width = railCanvas.clientWidth;
    rail.destroy();
    rail = createView(railCanvas, make()!, colourOf);
  }).observe(railCanvas);

  const dialog = mount.querySelector<HTMLDialogElement>('[data-graph-dialog]')!;
  let large: ReturnType<typeof createView> | null = null;
  railFrame.querySelector('[data-graph-expand]')!.addEventListener('click', () => {
    dialog.showModal();
    large = createView(dialog.querySelector<HTMLCanvasElement>('[data-graph-canvas]')!, make()!, colourOf, {
      labels: 'all',
    });
  });
  dialog.querySelector('[data-graph-zoom-in]')!.addEventListener('click', () => large?.zoomBy(1.25));
  dialog.querySelector('[data-graph-zoom-out]')!.addEventListener('click', () => large?.zoomBy(0.8));
  dialog.querySelector('[data-graph-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    large?.destroy();
    large = null;
  });

  legend(mount, graph, colourOf);
}

/**
 * The whole site's graph is fetched only as the rail comes near the screen:
 * at once from xl, where the rail is a column, but below xl only once the
 * reader scrolls towards the end of the article, where the rail sits.
 */
export function initGraph() {
  const mount = document.querySelector<HTMLElement>('[data-graph]');
  if (!mount) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      fetch('/graph.json', { credentials: 'same-origin' })
        .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
        .then((data: Data) => mountGraph(mount, data))
        .catch(() => mount.remove());
    },
    { rootMargin: '400px' },
  );
  observer.observe(mount.closest('#rail') ?? mount.parentElement!);
}
