// A heading is a link to itself (.anchor): following it also copies its
// address, confirmed for a moment beside it and read out. Where the
// clipboard is not available, it is an ordinary link.
export function initHeadingLinks() {
  if (!navigator.clipboard) return;
  var status = document.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('aria-live', 'polite');
  document.body.appendChild(status);
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a.anchor[href^="#"]');
    if (!link) return;
    navigator.clipboard.writeText(new URL(link.getAttribute('href'), location.href).href).then(
      function () {
        link.setAttribute('data-copied', '');
        status.textContent = 'Link copied';
        setTimeout(function () {
          link.removeAttribute('data-copied');
          status.textContent = '';
        }, 1500);
      },
      function () {},
    );
  });
}
