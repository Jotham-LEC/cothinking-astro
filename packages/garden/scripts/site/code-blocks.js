// A fenced code block in rendered Markdown (a bare <pre>; one a view writes
// carries classes) gets a header with its language and a copy button, drawn
// by the code-block-* classes in components.css.
export function initCodeBlocks() {
  document.querySelectorAll('.prose pre:not([class])').forEach(function (pre) {
    var match = /(?:^|\s)language-(\S+)/.exec((pre.querySelector('code') || pre).className);
    var block = document.createElement('div');
    block.className = 'code-block';
    var header = document.createElement('div');
    header.className = 'code-block-header';
    var label = document.createElement('span');
    label.className = 'code-block-lang';
    label.textContent = match ? match[1] : 'code';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-block-copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.textContent = 'Copy';
    button.addEventListener('click', function () {
      navigator.clipboard.writeText(pre.innerText).then(function () {
        button.textContent = 'Copied';
        setTimeout(function () {
          button.textContent = 'Copy';
        }, 1500);
      });
    });
    header.append(label, button);
    pre.replaceWith(block);
    block.append(header, pre);
    // A block wider than the page scrolls; let the keyboard reach it.
    if (pre.scrollWidth > pre.clientWidth) {
      pre.setAttribute('tabindex', '0');
      pre.setAttribute('aria-label', (match ? match[1] : 'Code') + ' example, scrolls sideways');
    }
  });
}
