// The Copy as Markdown button on a page with a Markdown copy (PageHeader,
// routes/[...uri].md.ts): fetches the copy, puts it on the clipboard and says
// so for a moment. Without the clipboard API the button stays hidden.
export function initCopyMarkdown() {
  const button = document.querySelector<HTMLButtonElement>('[data-copy-markdown]');
  if (!button || !navigator.clipboard) return;
  button.hidden = false;
  button.addEventListener('click', () => copy(button));
}

function copy(button: HTMLButtonElement) {
  const text = fetch(button.dataset.copyMarkdown!).then((response) => {
    if (!response.ok) throw new Error(`${response.status}`);
    return response.text();
  });
  // Safari writes the clipboard only within the click, so a ClipboardItem takes the text still on its way.
  const written =
    typeof ClipboardItem === 'undefined'
      ? text.then((t) => navigator.clipboard.writeText(t))
      : navigator.clipboard.write([
          new ClipboardItem({ 'text/plain': text.then((t) => new Blob([t], { type: 'text/plain' })) }),
        ]);
  written.then(
    () => say(button, 'Copied'),
    () => say(button, 'Copy failed'),
  );
}

function say(button: HTMLButtonElement, text: string) {
  const label = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = label;
  }, 1500);
}
