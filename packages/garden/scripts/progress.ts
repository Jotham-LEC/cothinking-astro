// How far down the page you are (components/Statusline.astro): the thin bar
// along the top at every width, and the status line's position in vim's
// words (Top, NN%, Bot, All) from lg up.
export function initProgress() {
  const bar = document.querySelector<HTMLElement>('[data-progress] > span');
  const status = document.querySelector<HTMLElement>('[data-status-scroll]');
  if (!bar && !status) return;
  let frame: number | null = null;
  function update() {
    const doc = document.documentElement;
    const scrolled = doc.scrollTop || document.body.scrollTop;
    const max = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (scrolled / max) * 100)) : 0;
    if (bar) bar.style.width = `${pct}%`;
    if (status)
      status.textContent =
        max <= 0 ? 'All' : pct <= 0 ? 'Top' : pct >= 100 ? 'Bot' : `${Math.min(99, Math.max(1, Math.round(pct)))}%`;
    frame = null;
  }
  const schedule = () => {
    frame ??= requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}
