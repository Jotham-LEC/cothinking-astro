// Heading ids as Laravel's `Str::slug` makes them, so every `page#heading`
// address the site has had keeps landing: transliterate to ASCII (curly quotes
// to straight, dashes to `-`, emoji dropped), `_` → `-`, `@` → `-at-`, lower
// case, drop anything but letters, digits, spaces and `-`, collapse runs to
// one `-`. Empty → `section`. Duplicates get `-1`, `-2`… as CommonMark does.

const PUNCTUATION: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '‚': "'",
  '‛': "'",
  '′': "'",
  '“': '"',
  '”': '"',
  '„': '"',
  '‟': '"',
  '″': '"',
  '‐': '-',
  '‑': '-',
  '‒': '-',
  '–': '-',
  '—': '-',
  '―': '-',
  '−': '-',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
  '　': ' ',
  '…': '...',
  '«': '<<',
  '»': '>>',
  '×': 'x',
  '©': '(c)',
  '®': '(r)',
  '™': 'tm',
  æ: 'ae',
  Æ: 'AE',
  œ: 'oe',
  Œ: 'OE',
  ß: 'ss',
  ø: 'o',
  Ø: 'O',
  ł: 'l',
  Ł: 'L',
  đ: 'd',
  Đ: 'D',
};

/** portable-ascii's `to_ascii` for the characters this content uses. */
export function toAscii(text: string): string {
  const mapped = text.replace(/[^\x00-\x7f]/gu, (ch) => PUNCTUATION[ch] ?? ch);
  // Decompose accented letters, then drop the marks and whatever is still outside ASCII (emoji, symbols).
  return mapped
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7f]/g, '');
}

export function laravelSlug(text: string, separator = '-'): string {
  let title = toAscii(text);
  const flip = separator === '-' ? '_' : '-';
  title = title.replace(new RegExp(`[${flip}]+`, 'g'), separator);
  title = title.replace(/@/g, `${separator}at${separator}`);
  title = title.toLowerCase().replace(new RegExp(`[^${separator}\\p{L}\\p{N}\\s]+`, 'gu'), '');
  title = title.replace(new RegExp(`[${separator}\\s]+`, 'gu'), separator);
  return title.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
}

export const headingSlug = (text: string): string => laravelSlug(text) || 'section';

/** A per-document slugger: the same text twice gets `-1`, then `-2`. */
export function uniqueSlugs(slug: (text: string) => string = headingSlug) {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = slug(text);
    const n = seen.get(base);
    if (n === undefined) {
      seen.set(base, 0);
      return base;
    }
    let candidate: string;
    let i = n;
    do {
      i += 1;
      candidate = `${base}-${i}`;
    } while (seen.has(candidate));
    seen.set(base, i);
    seen.set(candidate, 0);
    return candidate;
  };
}
