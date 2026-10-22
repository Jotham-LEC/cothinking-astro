// Pagefind's excerpt is text with <mark> around the matches; it is built
// here from text nodes and <mark> elements, never parsed as HTML.
function marked(excerpt) {
  var fragment = document.createDocumentFragment();
  var parts = (excerpt || '').split(/<\/?mark>/);
  var textarea = document.createElement('textarea');
  parts.forEach(function (part, i) {
    if (!part) return;
    textarea.innerHTML = part;
    var text = textarea.value;
    if (i % 2) {
      var mark = document.createElement('mark');
      mark.className = 'palette-mark';
      mark.textContent = text;
      fragment.appendChild(mark);
    } else {
      fragment.appendChild(document.createTextNode(text));
    }
  });
  return fragment;
}

// Pagefind's result URL, without the build's file name (`/x.html` → `/x`).
function cleanUrl(url) {
  return url.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
}

// The section a result sits in (Essays, Notes, …); none for a root page.
function sectionOf(r) {
  return (Array.isArray(r.breadcrumb) && r.breadcrumb[0]) || '';
}

// Cluster results by their top-level section, preserving the rank order both
// of sections (by first appearance) and of hits within each section.
function groupBySection(list) {
  var buckets = new Map();
  list.forEach(function (r) {
    var section = sectionOf(r);
    if (!buckets.has(section)) buckets.set(section, []);
    buckets.get(section).push(r);
  });
  var out = [];
  buckets.forEach(function (items) {
    out = out.concat(items);
  });
  return out;
}

// `beforeOpen` (the drawer's close) runs first, so the two dialogs never
// stack: each makes the page behind it inert, and closing one would undo
// the other's.
export function initPalette(beforeOpen) {
  var palette = document.querySelector('[data-palette]');
  var input = document.querySelector('[data-palette-input]');
  var results = document.querySelector('[data-palette-results]');
  var status = document.querySelector('[data-palette-status]');
  if (!palette || !input || !results) return;

  // Full-text matches come from Pagefind's index of the last build; if that
  // fails (astro dev before any build), typing filters the pre-rendered titles instead.
  // The path is a variable so Vite leaves the import to the browser: the index
  // exists only after a build (astro-pagefind serves the last one in dev).
  var pagefindUrl = '/pagefind/pagefind.js';
  var pagefind = null;
  function engine() {
    if (!pagefind) {
      pagefind = import(/* @vite-ignore */ pagefindUrl).then(function (module) {
        return module.init().then(function () {
          return module;
        });
      });
    }
    return pagefind;
  }
  var minChars = parseInt(palette.getAttribute('data-search-min'), 10) || 1;
  var originalHtml = results.innerHTML;
  var activeIndex = -1;
  var debounce = null;
  var requestId = 0;

  function items() {
    return Array.prototype.slice.call(results.querySelectorAll('li a'));
  }
  function visibleItems() {
    return items().filter(function (a) {
      return !a.parentNode.hasAttribute('hidden');
    });
  }
  // Says how many results there are, for a screen reader.
  function announce(count) {
    if (status) status.textContent = count ? count + (count === 1 ? ' result' : ' results') : 'No results';
  }
  function setActive(i) {
    var visible = visibleItems();
    if (!visible.length) {
      activeIndex = -1;
      return;
    }
    activeIndex = Math.max(0, Math.min(visible.length - 1, i));
    items().forEach(function (a) {
      a.classList.remove('is-active');
    });
    visible[activeIndex].classList.add('is-active');
    visible[activeIndex].scrollIntoView({ block: 'nearest' });
  }
  function localFilter(q) {
    q = q.trim().toLowerCase();
    items().forEach(function (a) {
      var label = a.getAttribute('data-label') || '';
      a.parentNode.toggleAttribute('hidden', !(!q || label.indexOf(q) !== -1));
      a.classList.remove('is-active');
    });
    setActive(0);
    announce(visibleItems().length);
  }
  function restore() {
    results.innerHTML = originalHtml;
  }
  function renderResults(list) {
    results.innerHTML = '';
    if (!list.length) {
      var empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.textContent = 'No results';
      results.appendChild(empty);
      activeIndex = -1;
      announce(0);
      return;
    }
    var lastSection = null;
    groupBySection(list).forEach(function (r) {
      var section = sectionOf(r);
      // Emit a header the first time each section's run begins. Headers are
      // header <li>s with no anchor, so keyboard navigation skips them.
      if (section !== lastSection) {
        lastSection = section;
        if (section !== '') {
          var header = document.createElement('li');
          header.className = 'palette-section';
          header.setAttribute('aria-hidden', 'true');
          header.textContent = section;
          results.appendChild(header);
        }
      }
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = r.url;
      a.setAttribute('data-label', (r.title || '').toLowerCase());
      var title = document.createElement('span');
      title.className = 'palette-title';
      title.textContent = r.title || '';
      a.appendChild(title);
      if (r.excerpt) {
        var excerpt = document.createElement('span');
        excerpt.className = 'palette-excerpt';
        excerpt.appendChild(marked(r.excerpt));
        a.appendChild(excerpt);
      }
      li.appendChild(a);
      results.appendChild(li);
    });
    setActive(0);
    announce(list.length);
  }
  function remoteSearch(q) {
    var id = ++requestId;
    engine()
      .then(function (pf) {
        return pf.search(q);
      })
      .then(function (search) {
        return Promise.all(
          search.results.slice(0, 20).map(function (result) {
            return result.data();
          }),
        );
      })
      .then(function (pages) {
        if (id !== requestId) return;
        renderResults(
          pages.map(function (page) {
            return {
              title: page.meta.title,
              url: cleanUrl(page.url),
              breadcrumb: page.meta.section ? [page.meta.section] : [],
              excerpt: page.excerpt,
            };
          }),
        );
      })
      // A failed search falls back to filtering the page titles.
      .catch(function () {
        if (id !== requestId) return;
        restore();
        localFilter(q);
      });
  }
  function onInput() {
    var q = input.value.trim();
    if (debounce) clearTimeout(debounce);
    if (q.length < minChars) {
      requestId++;
      restore();
      localFilter('');
      return;
    }
    debounce = setTimeout(function () {
      remoteSearch(q);
    }, 150);
  }

  // While the palette is open everything behind it is inert, so Tab stays
  // inside the dialog. Focus goes back to whatever opened it when it closes.
  var opener = null;
  var behind = Array.prototype.filter.call(document.body.children, function (el) {
    return el !== palette && el.tagName !== 'SCRIPT';
  });
  function setBehindInert(inert) {
    behind.forEach(function (el) {
      el.inert = inert;
    });
  }
  var mode = document.querySelector('[data-status-mode]');
  function open() {
    if (beforeOpen) beforeOpen(false);
    opener = document.activeElement;
    setBehindInert(true);
    if (mode) mode.textContent = 'SEARCH';
    palette.removeAttribute('hidden');
    input.value = '';
    restore();
    localFilter('');
    setTimeout(function () {
      input.focus();
    }, 10);
  }
  function close() {
    if (palette.hasAttribute('hidden')) return;
    palette.setAttribute('hidden', '');
    setBehindInert(false);
    if (mode) mode.textContent = mode.getAttribute('data-rest') || 'NORMAL';
    activeIndex = -1;
    if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    opener = null;
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette.hasAttribute('hidden')) open();
      else close();
      return;
    }
    if (palette.hasAttribute('hidden')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
    // Vim's Ctrl-n / Ctrl-p; plain j and k would be typed into the field.
    else if (e.ctrlKey && (e.key === 'n' || e.key === 'p')) {
      e.preventDefault();
      setActive(activeIndex + (e.key === 'n' ? 1 : -1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(activeIndex - 1);
    } else if (e.key === 'Enter' && document.activeElement === input) {
      var visible = visibleItems();
      if (visible[activeIndex]) {
        e.preventDefault();
        window.location.href = visible[activeIndex].href;
      }
    }
  });

  document.querySelectorAll('[data-palette-open]').forEach(function (btn) {
    btn.addEventListener('click', open);
  });
  document.querySelectorAll('[data-palette-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  input.addEventListener('input', onInput);
  return open;
}
