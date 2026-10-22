// An image in the text (not one that is a link) is a button: a click, Enter
// or Space enlarges it, again or Escape puts it back.
export function initZoom() {
  document.querySelectorAll('.prose :not(a) > img').forEach(function (img) {
    img.classList.add('zoomable');
    var alt = img.getAttribute('alt');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-pressed', 'false');
    img.setAttribute('aria-label', 'Enlarge image' + (alt ? ': ' + alt : ''));
    function toggle(zoomed) {
      img.classList.toggle('is-zoomed', zoomed);
      img.setAttribute('aria-pressed', zoomed ? 'true' : 'false');
    }
    img.addEventListener('click', function () {
      toggle(!img.classList.contains('is-zoomed'));
    });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(!img.classList.contains('is-zoomed'));
      }
      if (e.key === 'Escape' && img.classList.contains('is-zoomed')) {
        e.stopPropagation();
        toggle(false);
      }
    });
  });
}
