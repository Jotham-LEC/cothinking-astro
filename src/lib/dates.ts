// Every printed date goes through here. Statamic stores dates in UTC and prints
// them in its display timezone (Asia/Kuala_Lumpur), so the archive rows, eyebrows,
// note badges and year groups all format in that zone.
export const DISPLAY_TIMEZONE = 'Asia/Kuala_Lumpur';

const read = (date: Date, options: Intl.DateTimeFormatOptions): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('en-GB', options).formatToParts(date)) out[p.type] = p.value;
  return out;
};

const parts = (date: Date, timeZone: string): Record<string, string> => ({
  ...read(date, {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }),
  monthNumber: read(date, { timeZone, month: '2-digit' }).month!,
});

/**
 * Formats with PHP's date letters (the ones the views use): Y m d j n M F D l H i s.
 */
export function formatDate(date: Date, pattern: string, timeZone = DISPLAY_TIMEZONE): string {
  const p = parts(date, timeZone);
  const hour = p.hour === '24' ? '00' : p.hour;
  const map: Record<string, string> = {
    Y: p.year!,
    m: p.monthNumber,
    n: String(Number(p.monthNumber)),
    d: p.day!,
    j: String(Number(p.day)),
    M: p.month!.slice(0, 3),
    F: p.month!,
    D: p.weekday!.slice(0, 3),
    l: p.weekday!,
    H: hour,
    i: p.minute!,
    s: p.second!,
  };
  return pattern.replace(/[YmndjMFDlHis]/g, (letter) => map[letter] ?? letter);
}

/** `Y-m-d` in the display timezone, the form every list and eyebrow prints. */
export const day = (date: Date) => formatDate(date, 'Y-m-d');

/** The year in the display timezone (the publications archive's groups). */
export const year = (date: Date) => formatDate(date, 'Y');

/** RFC 2822 in UTC, as Carbon prints a stored date for `<pubDate>`. */
export function rfc2822(date: Date): string {
  return formatDate(date, 'D, d M Y H:i:s', 'UTC') + ' +0000';
}

/** Atom/ISO 8601 in UTC with a `+00:00` offset, as Carbon's toAtomString. */
export function atom(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}
