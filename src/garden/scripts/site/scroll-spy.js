export function initScrollSpy() {
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-toc] a'));
  if (!links.length) return;
  // The outline is printed twice (rail and below the article), so an id may
  // have two links; both light up.
  var byId = {};
  var ids = [];
  links.forEach(function (link) {
    var id = link.getAttribute('href').slice(1);
    if (!byId[id]) {
      byId[id] = [];
      ids.push(id);
    }
    byId[id].push(link);
  });
  var triggerOffset = 140;

  function update() {
    var doc = document.documentElement;
    var scrollY = window.scrollY;
    var maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);

    var heads = [];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      heads.push({ id: ids[i], y: el.getBoundingClientRect().top + scrollY });
    }
    if (!heads.length) return;

    var activations = heads.map(function (h) {
      return Math.max(0, h.y - triggerOffset);
    });

    // Headings whose natural activation point is past maxScroll can never highlight.
    // Redistribute them evenly across the remaining scroll range so each owns a slice.
    var firstUnreachable = -1;
    for (var k = 0; k < activations.length; k++) {
      if (activations[k] > maxScroll) {
        firstUnreachable = k;
        break;
      }
    }
    if (firstUnreachable >= 0) {
      var start = firstUnreachable === 0 ? 0 : activations[firstUnreachable - 1];
      var n = heads.length - firstUnreachable;
      var step = Math.max(1, (maxScroll - start) / n);
      for (var j = 0; j < n; j++) {
        activations[firstUnreachable + j] = start + step * (j + 1);
      }
    }

    var active = null;
    for (var m = 0; m < heads.length; m++) {
      if (activations[m] <= scrollY) active = heads[m].id;
      else break;
    }

    links.forEach(function (l) {
      l.classList.remove('is-active');
      l.removeAttribute('aria-current');
    });
    if (active && byId[active]) {
      byId[active].forEach(function (l) {
        l.classList.add('is-active');
        l.setAttribute('aria-current', 'true');
      });
    }
  }

  var raf = null;
  function schedule() {
    if (raf !== null) return;
    raf = requestAnimationFrame(function () {
      raf = null;
      update();
    });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}
