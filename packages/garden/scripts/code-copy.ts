// The copy button on a code block (the Markdown pipeline draws the block:
// lib/markdown/shiki-code-block.ts): one listener for every block, which
// copies the code and says so for a moment. Without the clipboard API the
// buttons are hidden.
export function initCodeCopy() {
  if (!navigator.clipboard) {
    for (const button of document.querySelectorAll<HTMLElement>('.code-block-copy')) button.hidden = true;
    return;
  }
  if (document.body.hasAttribute('data-code-copy')) return;
  document.body.setAttribute('data-code-copy', '');
  document.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLButtonElement>('.code-block-copy');
    const pre = button?.closest('.code-block')?.querySelector('pre');
    if (!button || !pre) return;
    navigator.clipboard.writeText(pre.innerText).then(() => {
      button.textContent = 'Copied';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 1500);
    });
  });
  // A block wider than the page scrolls; let the keyboard reach it.
  for (const pre of document.querySelectorAll<HTMLElement>('.code-block pre'))
    if (pre.scrollWidth > pre.clientWidth) pre.setAttribute('tabindex', '0');
}
