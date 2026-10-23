// Every printed date goes through here, in the display timezone
// (Asia/Kuala_Lumpur, where the old site printed its UTC dates), with the
// platform's Intl.DateTimeFormat: the archive rows, eyebrows, note badges,
// year groups and the terms' date.
const DISPLAY_TIMEZONE = 'Asia/Kuala_Lumpur';

const parts = (date: Date, locale: string, options: Intl.DateTimeFormatOptions): Record<string, string> =>
  Object.fromEntries(
    new Intl.DateTimeFormat(locale, { timeZone: DISPLAY_TIMEZONE, ...options })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );

/** `2026-10-08`, the form every list and eyebrow prints. */
export function day(date: Date): string {
  const p = parts(date, 'en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${p.year}-${p.month}-${p.day}`;
}

/** `2026`: the publications archive's groups. */
export const year = (date: Date): string => parts(date, 'en-GB', { year: 'numeric' }).year!;

/** `8 October 2026`. */
export const longDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

/** A note's badge: `{ month: 'Oct', day: '8' }` (en-US, whose short September is `Sep`, not en-GB's `Sept`). */
export function badge(date: Date): { month: string; day: string } {
  const p = parts(date, 'en-US', { month: 'short', day: 'numeric' });
  return { month: p.month!, day: p.day! };
}
