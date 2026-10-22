// Hover previews, after Quartz: on a pointer device from the lg breakpoint
// up, resting on a link in the page's text shows a card beside it. A link
// to another page of this site shows the parts that page marks with
// [data-popover]; a link to another site (.external-link) shows only where
// it leads, built here without a request. A page's fetch starts once the
// pointer has rested on the link for a moment, so sweeping across a
// paragraph fetches nothing; the link shows that it is loading, and the
// card can be scrolled.
export function initPopovers() {
  if (!window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) return;
  var links = Array.prototype.filter.call(document.querySelectorAll('main a[href]'), function (link) {
    if (link.closest('nav, .not-prose, [data-stream]') || link.matches('.anchor, .button')) return false;
    if (link.classList.contains('external-link')) return true;
    // Another page of this site: not a file, and not a jump within this page.
    return (
      link.origin === location.origin && link.pathname !== location.pathname && !/\.[a-z0-9]+$/i.test(link.pathname)
    );
  });
  if (!links.length) return;
  var cache = {};
  var open = null;
  var timer = null;
  var fetchTimer = null;

  // A page of this site: the parts it marks for previewing, as nodes.
  function pagePreview(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) {
        return r.ok ? r.text() : Promise.reject(r.status);
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var parts = doc.querySelectorAll('[data-popover]');
        if (!parts.length) return null;
        var box = document.createElement('div');
        parts.forEach(function (part) {
          var clone = part.cloneNode(true);
          clone.querySelectorAll('[id]').forEach(function (el) {
            el.id = 'popover-' + el.id;
          });
          clone.querySelectorAll('script').forEach(function (el) {
            el.remove();
          });
          box.appendChild(clone);
        });
        return box;
      });
  }

  // Another site: no preview, only a card saying where the link leads.
  function sitePreview(link) {
    var box = document.createElement('div');
    [
      ['popover-host', link.hostname.replace(/^www\./, '') + ' ↗'],
      ['popover-url', link.href],
      ['popover-note', 'Opens another site.'],
    ].forEach(function (line) {
      var p = document.createElement('p');
      p.className = line[0];
      p.textContent = line[1];
      box.appendChild(p);
    });
    return box;
  }

  function preview(link) {
    if (link.classList.contains('external-link')) return Promise.resolve(sitePreview(link));
    var key = link.href.split('#')[0];
    if (!cache[key]) {
      cache[key] = pagePreview(key).catch(function () {
        return null;
      });
    }
    return cache[key];
  }

  function close() {
    if (open) {
      open.remove();
      open = null;
    }
  }

  function show(link, content) {
    close();
    var card = document.createElement('div');
    card.className = 'popover';
    card.appendChild(content.cloneNode(true));
    document.body.appendChild(card);
    var rect = link.getBoundingClientRect();
    var width = card.offsetWidth;
    var height = card.offsetHeight;
    var left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    var top = rect.bottom + 8 + height > window.innerHeight ? rect.top - height - 8 : rect.bottom + 8;
    card.style.left = left + 'px';
    card.style.top = Math.max(8, top) + 'px';
    card.addEventListener('mouseleave', close);
    open = card;
  }

  links.forEach(function (link) {
    link.addEventListener('mouseenter', function () {
      clearTimeout(timer);
      clearTimeout(fetchTimer);
      // After 100ms on the link its preview is fetched, and the link shows
      // it is loading until it is ready; the card waits for both the
      // preview and 1.5s of rest, so passing over a link never opens one.
      var ready = new Promise(function (resolve) {
        fetchTimer = setTimeout(function () {
          link.classList.add('is-previewing');
          var loading = preview(link);
          loading.then(function () {
            link.classList.remove('is-previewing');
          });
          resolve(loading);
        }, 100);
      });
      timer = setTimeout(function () {
        ready.then(function (content) {
          if (content && link.matches(':hover')) show(link, content);
        });
      }, 1500);
    });
    link.addEventListener('mouseleave', function () {
      clearTimeout(timer);
      clearTimeout(fetchTimer);
      link.classList.remove('is-previewing');
      setTimeout(function () {
        if (open && !open.matches(':hover') && !link.matches(':hover')) close();
      }, 150);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
  window.addEventListener('scroll', close, { passive: true });
}
