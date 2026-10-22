// The share card's colours, read off styles/tokens.css so the CSS stays the
// one place a colour is written: the dark value of light-dark() for the
// ground, headings and muted text, and the brand yellow (tests/tokens.test.ts
// guards the shapes these regexes expect).
export type Palette = { background: string; heading: string; muted: string; accent: string };

export function paletteFrom(css: string): Palette {
  const dark = (token: string) => {
    const m = new RegExp(`--${token}:\\s*light-dark\\(#[0-9a-f]+,\\s*(#[0-9a-f]+)\\)`, 'i').exec(css);
    if (!m) throw new Error(`styles/tokens.css: no light-dark() hex pair for --${token}.`);
    return m[1]!;
  };
  const plain = (token: string) => {
    const m = new RegExp(`--${token}:\\s*(#[0-9a-f]+);`, 'i').exec(css);
    if (!m) throw new Error(`styles/tokens.css: no hex value for --${token}.`);
    return m[1]!;
  };
  return { background: dark('site-bg'), heading: dark('site-heading'), muted: dark('site-muted'), accent: plain('brand-yellow') };
}
