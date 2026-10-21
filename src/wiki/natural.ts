// PHP's strnatcasecmp (SORT_NATURAL | SORT_FLAG_CASE), which the Laravel app
// sorted titles with: case-insensitive, runs of digits compared as numbers,
// and whitespace skipped altogether, so "Guide: X" sorts before "Guide to Y".
export function naturalCompare(a: string, b: string): number {
  const A = a.toLowerCase().replace(/\s+/g, '');
  const B = b.toLowerCase().replace(/\s+/g, '');
  let i = 0,
    j = 0;
  while (i < A.length && j < B.length) {
    const ca = A[i]!,
      cb = B[j]!;
    const da = /\d/.test(ca),
      db = /\d/.test(cb);
    if (da && db) {
      let na = '',
        nb = '';
      while (i < A.length && /\d/.test(A[i]!)) na += A[i++];
      while (j < B.length && /\d/.test(B[j]!)) nb += B[j++];
      // A run starting with 0 compares as a fraction (left-aligned), as strnatcmp does.
      if (na.startsWith('0') || nb.startsWith('0')) {
        const cmp = na.localeCompare(nb);
        if (cmp !== 0) return cmp < 0 ? -1 : 1;
      } else {
        if (na.length !== nb.length) return na.length < nb.length ? -1 : 1;
        if (na !== nb) return na < nb ? -1 : 1;
      }
      continue;
    }
    if (ca !== cb) return ca < cb ? -1 : 1;
    i++;
    j++;
  }
  return A.length - i === B.length - j ? 0 : A.length - i < B.length - j ? -1 : 1;
}
