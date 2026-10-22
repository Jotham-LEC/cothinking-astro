// The copy button on a code block (the Markdown pipeline draws the block:
// lib/markdown/shiki-code-block.ts): one listener for every block, which
// copies the code and says so for a moment. Without the clipboard API the
// buttons are hidden.
export function initCodeCopy() {
  if (!navigator.clipboard) {
    document.querySelectorAll('.code-block-copy').forEach(function (button) {
      button.hidden = true;
    });
    return;
  }
  document.addEventListener('click', function (e) {
    var button = e.target.closest('.code-block-copy');
    if (!button) return;
    var pre = button.closest('.code-block').querySelector('pre');
    if (!pre) return;
    navigator.clipboard.writeText(pre.innerText).then(function () {
      button.textContent = 'Copied';
      setTimeout(function () {
        button.textContent = 'Copy';
      }, 1500);
    });
  });
  // A block wider than the page scrolls; let the keyboard reach it.
  document.querySelectorAll('.code-block pre').forEach(function (pre) {
    if (pre.scrollWidth > pre.clientWidth) pre.setAttribute('tabindex', '0');
  });
}
