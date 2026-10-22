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
  essays: 'text-graph-essays',
  notes: 'text-graph-notes',
  publications: 'text-graph-publications',
  projects: 'text-graph-projects',
  pages: 'text-graph-pages',
};

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

/**
 * A graph drawn on a canvas, laid out by d3-force and interactive: the wheel
 * (or zoomBy) zooms about the pointer, dragging the background pans (a double
 * click there puts the view back), dragging a page pins it while the others
 * follow, and a press that does not move opens the page. `labels: 'all'`
 * names every page (the dialog); else only the current page and the one
 * under the pointer. Returns zoomBy and destroy, which stops the simulation
 * and drops the listeners.
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
  const ctx = canvas.getContext('2d')!;
  const listeners = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options: AddEventListenerOptions = {},
  ) => canvas.addEventListener(type, handler, { ...options, signal: listeners.signal });

  const palette = () => ({
    sections: Object.fromEntries(Object.entries(COLOURS).map(([token, className]) => [token, colorOf(className)])),
    link: colorOf('text-subtle'),
    ring: colorOf('text-heading'),
    label: colorOf('text-fg'),
  });
  let colors = palette();
  let view = { k: 1, x: 0, y: 0 };
  let hovered: SimNode | null = null;
  let pressed: { node: SimNode | null; start: { x: number; y: number }; view: typeof view; moved: boolean } | null =
    null;

  const degree: Record<string, number> = {};
  for (const link of graph.links) {
    degree[link.source] = (degree[link.source] ?? 0) + 1;
    degree[link.target] = (degree[link.target] ?? 0) + 1;
  }
  const isCurrent = (node: Node) => node.id === graph.current.id;
  const radius = (node: Node) => 4 + Math.min(6, degree[node.id] ?? 0) + (isCurrent(node) ? 3 : 0);
  const simLinks = graph.links.map((l) => ({ ...l })) as unknown as SimLink[];

  // Spread in proportion to the canvas (the rail's is about 270px), with room for a label under every page when all are named.
  const spread = Math.max(1, Math.min(width, height) / 270);
  const simulation = forceSimulation(graph.nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((node) => node.id)
        .distance(45 * spread),
    )
    .force('charge', forceManyBody().strength(-120 * spread))
    .force('center', forceCenter(width / 2, height / 2))
    .force(
      'collide',
      forceCollide<SimNode>().radius((node) => radius(node) + (labels === 'all' ? 40 : 14)),
    )
    .on('tick', render);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    simulation.stop();
    for (let i = 0; i < 200; i++) simulation.tick();
    render();
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(view.x, view.y);
    ctx.scale(view.k, view.k);
    ctx.lineWidth = 1 / view.k;
    ctx.strokeStyle = colors.link;
    for (const link of simLinks) {
      ctx.beginPath();
      ctx.moveTo(link.source.x!, link.source.y!);
      ctx.lineTo(link.target.x!, link.target.y!);
      ctx.stroke();
    }
    for (const node of graph.nodes) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius(node), 0, Math.PI * 2);
      ctx.fillStyle = colors.sections[colourOf(node)]!;
      ctx.fill();
      if (isCurrent(node) || node === hovered) {
        ctx.lineWidth = (isCurrent(node) ? 2 : 1) / view.k;
        ctx.strokeStyle = colors.ring;
        ctx.stroke();
      }
    }
    // Labels keep their size on screen at any zoom.
    ctx.font = `${11 / view.k}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.label;
    for (const node of graph.nodes) {
      if (labels !== 'all' && node !== hovered && !isCurrent(node)) continue;
      const label = node.title.length > 28 ? `${node.title.slice(0, 27)}…` : node.title;
      ctx.fillText(label, node.x!, node.y! + radius(node) + 14 / view.k);
    }
  }

  // Where a pointer event falls, in the canvas and in the graph.
  function point(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y, gx: (x - view.x) / view.k, gy: (y - view.y) / view.k };
  }
  const nodeAt = (p: { gx: number; gy: number }) =>
    graph.nodes.find((node) => Math.hypot(node.x! - p.gx, node.y! - p.gy) <= radius(node) + 4 / view.k) ?? null;
  function zoomBy(factor: number, x = width / 2, y = height / 2) {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor));
    view = { k, x: x - ((x - view.x) * k) / view.k, y: y - ((y - view.y) * k) / view.k };
    render();
  }
  function release(event: PointerEvent) {
    if (!pressed) return;
    const { node, moved } = pressed;
    pressed = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
    if (node) {
      node.fx = node.fy = null;
      simulation.alphaTarget(0);
      if (!moved && event.type === 'pointerup' && !isCurrent(node)) window.location.href = node.url;
    }
  }

  on(
    'wheel',
    (event) => {
      event.preventDefault();
      const p = point(event);
      zoomBy(Math.exp(-event.deltaY * 0.002), p.x, p.y);
    },
    { passive: false },
  );
  on('pointerdown', (event) => {
    const p = point(event);
    const node = nodeAt(p);
    pressed = { node, start: p, view: { ...view }, moved: false };
    canvas.setPointerCapture(event.pointerId);
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
      simulation.alphaTarget(0.3).restart();
    }
    canvas.style.cursor = 'grabbing';
  });
  on('pointermove', (event) => {
    const p = point(event);
    if (pressed) {
      pressed.moved = pressed.moved || Math.hypot(p.x - pressed.start.x, p.y - pressed.start.y) > 4;
      if (pressed.node) {
        pressed.node.fx = p.gx;
        pressed.node.fy = p.gy;
      } else {
        view = {
          ...pressed.view,
          x: pressed.view.x + p.x - pressed.start.x,
          y: pressed.view.y + p.y - pressed.start.y,
        };
        render();
      }
      return;
    }
    const node = nodeAt(p);
    if (node !== hovered) {
      hovered = node;
      canvas.style.cursor = node ? 'pointer' : 'grab';
      canvas.title = node ? node.title : '';
      render();
    }
  });
  on('pointerup', release);
  on('pointercancel', release);
  // A double click on the background puts the view back.
  on('dblclick', (event) => {
    if (nodeAt(point(event))) return;
    view = { k: 1, x: 0, y: 0 };
    render();
  });
  on('pointerleave', () => {
    if (!pressed && hovered) {
      hovered = null;
      render();
    }
  });
  canvas.style.cursor = 'grab';

  // New colours when the scheme changes: the header's toggle sets data-theme, and a reader following the system has the OS switch it.
  const recolor = () => {
    colors = palette();
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
    item.append(dot, (token !== 'pages' && titles[token]) || 'pages');
    list.appendChild(item);
  }
  mount.appendChild(list);
}

/** The rail's graph, its zoom buttons, and the dialog that shows it larger with every page named (a fresh copy, laid out again at that size). */
function mountGraph(mount: HTMLElement, data: Data) {
  const sectionColours: Record<string, string> = JSON.parse(mount.dataset.graphColours ?? '{}');
  const colourOf = (node: Node) => {
    const token = sectionColours[node.section] ?? 'pages';
    return token in COLOURS ? token : 'pages';
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
