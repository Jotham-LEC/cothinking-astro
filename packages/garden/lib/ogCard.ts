// The share card (ported from the old Laravel site's, drawn by simonhamp/the-og there): the
// brand's dark palette with a yellow left edge, the section label up top,
// the title and its opening words, the site's name along the bottom beside a
// round portrait. satori lays it out, resvg rasterises it. The fonts (the
// Aporetic woff2 files as TTF, assets/fonts/ttf), the portrait and the
// colours (styles/tokens.css) are inlined by Vite, so nothing is read by path.
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import bold from '../assets/fonts/ttf/aporetic-sans-bold.ttf?inline';
import extrabold from '../assets/fonts/ttf/aporetic-sans-extrabold.ttf?inline';
import regular from '../assets/fonts/ttf/aporetic-sans-regular.ttf?inline';
import portrait from '../assets/portrait.jpg?inline';
import tokens from '../styles/tokens.css?raw';
import { cardColoursFrom } from './cardColours.ts';

const CARD = { width: 1200, height: 630, border: 20, padding: 64 };
const PALETTE = cardColoursFrom(tokens);

export type CardInput = { label: string; title: string; description: string | null; url: string };

/** A `?inline` import is a data URL; satori wants the bytes. */
const bytes = (dataUrl: string) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
const FONTS = [
  { name: 'Aporetic Sans', data: bytes(regular), weight: 400 as const, style: 'normal' as const },
  { name: 'Aporetic Sans', data: bytes(bold), weight: 700 as const, style: 'normal' as const },
  { name: 'Aporetic Sans', data: bytes(extrabold), weight: 800 as const, style: 'normal' as const },
];

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });

export async function renderCard(card: CardInput): Promise<Buffer> {
  const width = CARD.width - CARD.border - CARD.padding * 2;
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
          {
            type: 'img',
            props: {
              src: portrait,
              width: 120,
              height: 120,
              style: { width: 120, height: 120, borderRadius: 60, objectFit: 'cover' },
            },
          },
        ],
      ),
    ],
  );
  const svg = await satori(tree as never, { width: CARD.width, height: CARD.height, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: CARD.width } }).render().asPng();
}
