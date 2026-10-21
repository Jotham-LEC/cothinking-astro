// The local graph in the rail, after Quartz: this page and the pages one link
// away, laid out by d3-force on a canvas, which can be zoomed, panned, pulled
// about and opened larger in a dialog. Nodes link to their pages; the
// module hides itself when the page has no neighbours, since a lone dot says
// nothing. Each node takes its section's colour (a legend under the canvas
// names them); the current page is larger and ringed. Colours come from the
// site's tokens, read off probe elements so light and dark mode both apply.
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

function colorOf(className) {
  const probe = document.createElement('span');
  probe.className = className;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

// Section (a collection's handle, as graph.json names it; '' is a root page)
// → the utility that carries its colour. The legend shows the collection's
// title (`section_title`), so a renamed collection keeps its colour. The class names are written out in full so
// Tailwind's scan generates them. cothink.ing's sections borrow jothamlim.com's
// colours, as the two sites' graphs never meet.
const SECTIONS = {
  essays: 'text-graph-essays',
  notes: 'text-graph-notes',
  publications: 'text-graph-publications',
  projects: 'text-graph-projects',
  wiki: 'text-graph-essays',
  work: 'text-graph-projects',
  problems: 'text-graph-notes',
  '': 'text-graph-pages',
};

function sectionOf(node) {
  const section = node.section || '';
  return section in SECTIONS ? section : '';
}

function palette() {
  return {
    sections: Object.fromEntries(Object.entries(SECTIONS).map(([section, className]) => [section, colorOf(className)])),
    link: colorOf('text-subtle'),
    ring: colorOf('text-heading'),
    label: colorOf('text-fg'),
  };
}

// One dot and name per section present, so colour is not the only key.
function legend(mount, graph) {
  const present = new Set(graph.nodes.map(sectionOf));
  const titles = Object.fromEntries(
    graph.nodes.map((node) => [sectionOf(node), (node.section_title || '').toLowerCase()]),
  );
  const list = document.createElement('ul');
  list.className = 'text-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs';
  Object.entries(SECTIONS).forEach(([section, className]) => {
    if (!present.has(section)) return;
    const item = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = className + ' mr-1';
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = '●';
    item.append(dot, (section && titles[section]) || 'pages');
    list.appendChild(item);
  });
  mount.appendChild(list);
}

// The page and its neighbours one link away. A section's index that names its
// section (data-graph-section: cothink.ing's Wiki) holds every page of the
// section instead, each tied to the index, with the links between them.
function neighbourhood(data, url, section) {
  const current = data.nodes.find((node) => node.url === url);
  if (!current) return null;
  const near = new Set([current.id]);
  data.links.forEach((link) => {
    if (link.source === current.id) near.add(link.target);
    if (link.target === current.id) near.add(link.source);
  });
  const members = section ? data.nodes.filter((node) => node.section === section).map((node) => node.id) : [];
  members.forEach((id) => near.add(id));
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

// A graph drawn on a canvas, laid out by d3-force and interactive: the wheel
// (or zoomBy) zooms about the pointer, dragging the background pans (a
// double click there puts the view back), dragging a page pins it while the
// others follow, and a press that does not move opens the page. `labels: 'all'` names every page (the dialog); else
// only the current page and the one under the pointer. Returns zoomBy and
// destroy, which stops the simulation and drops the listeners.
function createView(canvas, graph, { labels = 'hover' } = {}) {
  // The canvas's CSS size (the rail's is square, the dialog's fills it) at
  // the screen's pixel density.
  const width = canvas.clientWidth || 272;
  const height = canvas.clientHeight || width;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  const listeners = new AbortController();
  const on = (target, type, handler, options = {}) =>
    target.addEventListener(type, handler, { ...options, signal: listeners.signal });

  let colors = palette();
  let view = { k: 1, x: 0, y: 0 };
  let hovered = null;
  let pressed = null;

  const degree = {};
  graph.links.forEach((link) => {
    degree[link.source] = (degree[link.source] || 0) + 1;
    degree[link.target] = (degree[link.target] || 0) + 1;
  });
  const isCurrent = (node) => node.id === graph.current.id;
  const radius = (node) => 4 + Math.min(6, degree[node.id] || 0) + (isCurrent(node) ? 3 : 0);

  // Spread in proportion to the canvas (the rail's is about 270px), with
  // room for a label under every page when all are named.
  const spread = Math.max(1, Math.min(width, height) / 270);
  const simulation = forceSimulation(graph.nodes)
    .force(
      'link',
      forceLink(graph.links)
        .id((node) => node.id)
        .distance(45 * spread),
    )
    .force('charge', forceManyBody().strength(-120 * spread))
    .force('center', forceCenter(width / 2, height / 2))
    .force(
      'collide',
      forceCollide().radius((node) => radius(node) + (labels === 'all' ? 40 : 14)),
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
    graph.links.forEach((link) => {
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.stroke();
    });
    graph.nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius(node), 0, Math.PI * 2);
      ctx.fillStyle = colors.sections[sectionOf(node)];
      ctx.fill();
      if (isCurrent(node) || node === hovered) {
        ctx.lineWidth = (isCurrent(node) ? 2 : 1) / view.k;
        ctx.strokeStyle = colors.ring;
        ctx.stroke();
      }
    });
    // Labels keep their size on screen at any zoom.
    ctx.font = 11 / view.k + 'px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.label;
    graph.nodes.forEach((node) => {
      if (labels !== 'all' && node !== hovered && !isCurrent(node)) return;
      const label = node.title.length > 28 ? node.title.slice(0, 27) + '…' : node.title;
      ctx.fillText(label, node.x, node.y + radius(node) + 14 / view.k);
    });
  }

  // Where a pointer event falls, in the canvas and in the graph.
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y, gx: (x - view.x) / view.k, gy: (y - view.y) / view.k };
  }
  function nodeAt(p) {
    return graph.nodes.find((node) => Math.hypot(node.x - p.gx, node.y - p.gy) <= radius(node) + 4 / view.k) || null;
  }
  function zoomBy(factor, x = width / 2, y = height / 2) {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor));
    view = { k, x: x - ((x - view.x) * k) / view.k, y: y - ((y - view.y) * k) / view.k };
    render();
  }

  on(
    canvas,
    'wheel',
    (event) => {
      event.preventDefault();
      const p = point(event);
      zoomBy(Math.exp(-event.deltaY * 0.002), p.x, p.y);
    },
    { passive: false },
  );

  on(canvas, 'pointerdown', (event) => {
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
  on(canvas, 'pointermove', (event) => {
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
  on(canvas, 'pointerup', (event) => {
    if (!pressed) return;
    const { node, moved } = pressed;
    pressed = null;
    canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
    if (node) {
      node.fx = node.fy = null;
      simulation.alphaTarget(0);
      if (!moved && !isCurrent(node)) window.location.href = node.url;
    }
  });
  // A double click on the background puts the view back.
  on(canvas, 'dblclick', (event) => {
    if (nodeAt(point(event))) return;
    view = { k: 1, x: 0, y: 0 };
    render();
  });
  on(canvas, 'pointerleave', () => {
    if (!pressed && hovered) {
      hovered = null;
      render();
    }
  });
  canvas.style.cursor = 'grab';

  // New colours when the scheme changes: the header's toggle sets
  // data-theme, and a reader following the system has the OS switch it.
  const recolor = () => {
    colors = palette();
    render();
  };
  const themes = new MutationObserver(recolor);
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  on(window.matchMedia('(prefers-color-scheme: dark)'), 'change', recolor);

  return {
    zoomBy,
    destroy() {
      simulation.stop();
      listeners.abort();
      themes.disconnect();
    },
  };
}

// The rail's graph, its zoom buttons, and the dialog that shows it larger
// with every page named (a fresh copy, laid out again at that size).
function mountGraph(mount, data) {
  const make = () => neighbourhood(data, mount.getAttribute('data-graph'), mount.getAttribute('data-graph-section'));
  const graph = make();
  if (!graph) {
    mount.remove();
    return;
  }
  mount.hidden = false;

  const railCanvas = mount.querySelector('[data-graph-canvas]');
  const rail = createView(railCanvas, graph);
  const railFrame = railCanvas.parentElement;
  railFrame.querySelector('[data-graph-zoom-in]').addEventListener('click', () => rail.zoomBy(1.25));
  railFrame.querySelector('[data-graph-zoom-out]').addEventListener('click', () => rail.zoomBy(0.8));

  const dialog = mount.querySelector('[data-graph-dialog]');
  let large = null;
  railFrame.querySelector('[data-graph-expand]').addEventListener('click', () => {
    dialog.showModal();
    large = createView(dialog.querySelector('[data-graph-canvas]'), make(), { labels: 'all' });
  });
  dialog.querySelector('[data-graph-zoom-in]').addEventListener('click', () => large && large.zoomBy(1.25));
  dialog.querySelector('[data-graph-zoom-out]').addEventListener('click', () => large && large.zoomBy(0.8));
  dialog.querySelector('[data-graph-close]').addEventListener('click', () => dialog.close());
  // A click on the backdrop (the dialog itself, outside its content) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (large) {
      large.destroy();
      large = null;
    }
  });

  legend(mount, graph);
}

const mounts = document.querySelectorAll('[data-graph]');

function load() {
  fetch(mounts[0].getAttribute('data-graph-url'), { credentials: 'same-origin' })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data) => mounts.forEach((mount) => mountGraph(mount, data)))
    .catch(() => mounts.forEach((mount) => mount.remove()));
}

// The whole site's graph is fetched only as the rail comes near the screen:
// at once from xl, where the rail is a column, but below xl only once the
// reader scrolls towards the end of the article, where the rail sits. The
// mount itself is hidden until then, so the rail is what is watched.
if (mounts.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    },
    { rootMargin: '400px' },
  );
  observer.observe(mounts[0].closest('[data-rail]') || mounts[0].parentElement);
}
