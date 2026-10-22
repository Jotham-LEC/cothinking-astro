// The share card (App\Support\OgCard, drawn by simonhamp/the-og there): the
// brand's dark palette with a yellow left edge, the section label up top,
// the title and its opening words, the site's name along the bottom beside a
// round portrait. satori lays it out, resvg rasterises it; the fonts are the
// repo's Aporetic woff2 files decompressed to TTF (src/assets/fonts/ttf).
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const CARD = { width: 1200, height: 630, border: 20, padding: 64 };
/** config('site.og'): the tokens' dark values (tests in the Laravel repo kept them equal). */
const PALETTE = { background: '#282828', heading: '#fbf1c7', muted: '#bdae93', accent: '#fad03a' };

export type CardInput = {
  label: string;
  title: string;
  description: string | null;
  url: string;
  portrait: string | null;
};

let fonts: { name: string; data: Buffer; weight: 400 | 700 | 800; style: 'normal' }[] | null = null;

function loadFonts(root: string) {
  const dir = path.join(root, 'src/assets/fonts/ttf');
  fonts ??= [
    {
      name: 'Aporetic Sans',
      data: fs.readFileSync(path.join(dir, 'aporetic-sans-regular.ttf')),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Aporetic Sans',
      data: fs.readFileSync(path.join(dir, 'aporetic-sans-bold.ttf')),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Aporetic Sans',
      data: fs.readFileSync(path.join(dir, 'aporetic-sans-extrabold.ttf')),
      weight: 800,
      style: 'normal',
    },
  ];
  return fonts;
}

const portraits = new Map<string, string | null>();
function portraitDataUrl(root: string, file: string | null): string | null {
  if (!file) return null;
  if (!portraits.has(file)) {
    const full = path.join(root, 'public', file);
    portraits.set(
      file,
      fs.existsSync(full)
        ? `data:image/${path.extname(full).slice(1).replace('jpg', 'jpeg')};base64,${fs.readFileSync(full).toString('base64')}`
        : null,
    );
  }
  return portraits.get(file) ?? null;
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });

export async function renderCard(root: string, card: CardInput): Promise<Buffer> {
  const width = CARD.width - CARD.border - CARD.padding * 2;
  const portrait = portraitDataUrl(root, card.portrait);
  const tree = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      width: CARD.width,
      height: CARD.height,
      background: PALETTE.background,
      borderLeft: `${CARD.border}px solid ${PALETTE.accent}`,
      padding: CARD.padding,
      fontFamily: 'Aporetic Sans',
      color: PALETTE.heading,
    },
    [
      el(
        'div',
        { display: 'flex', width, height: 40, fontSize: 26, fontWeight: 700, color: PALETTE.accent, letterSpacing: 1 },
        card.label.toUpperCase(),
      ),
      el(
        'div',
        {
          display: 'flex',
          width,
          maxHeight: 260,
          marginTop: 28,
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.1,
          overflow: 'hidden',
          textWrap: 'balance',
        },
        card.title,
      ),
      card.description
        ? el(
            'div',
            {
              display: 'flex',
              width: width - 140,
              maxHeight: 120,
              marginTop: 24,
              fontSize: 30,
              lineHeight: 1.3,
              color: PALETTE.muted,
              overflow: 'hidden',
            },
            card.description,
          )
        : el('div', { display: 'flex' }),
      el('div', { display: 'flex', flex: 1 }),
      el(
        'div',
        { display: 'flex', flexShrink: 0, alignItems: 'flex-end', justifyContent: 'space-between', width, height: 120 },
        [
          el(
            'div',
            { display: 'flex', height: 40, fontSize: 30, fontWeight: 700, color: PALETTE.muted, alignItems: 'center' },
            card.url,
          ),
          portrait
            ? {
                type: 'img',
                props: {
                  src: portrait,
                  width: 120,
                  height: 120,
                  style: { width: 120, height: 120, borderRadius: 60, objectFit: 'cover' },
                },
              }
            : el('div', { display: 'flex' }),
        ],
      ),
    ],
  );
  const svg = await satori(tree as never, { width: CARD.width, height: CARD.height, fonts: loadFonts(root) });
  return new Resvg(svg, { fitTo: { mode: 'width', value: CARD.width } }).render().asPng();
}
