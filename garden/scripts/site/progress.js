// How far down the page you are: the thin bar along the top at every width,
// and the status line's position in vim's words (Top, NN%, Bot, All) from lg up.
export function initProgress() {
  var bar = document.querySelector('[data-progress] > span');
  var status = document.querySelector('[data-status-scroll]');
  if (!bar && !status) return;
  var rafId = null;
  function update() {
    var doc = document.documentElement;
    var scrolled = doc.scrollTop || document.body.scrollTop;
    var max = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (scrolled / max) * 100)) : 0;
    if (bar) bar.style.width = pct + '%';
    if (status) {
      status.textContent =
        max <= 0 ? 'All' : pct <= 0 ? 'Top' : pct >= 100 ? 'Bot' : Math.min(99, Math.max(1, Math.round(pct))) + '%';
    }
    rafId = null;
  }
  function schedule() {
    if (rafId === null) rafId = requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}
