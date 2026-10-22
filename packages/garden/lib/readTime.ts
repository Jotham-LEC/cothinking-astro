// Statamic's `read_time` modifier: its word count (runs of letters, digits and
// apostrophes; PHP's array_filter also drops a lone "0") over the text with
// tags stripped, divided by 200 words a minute, rounded up.
export function wordCount(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, '');
  if (stripped.trim() === '') return 0;
  return stripped.split(/[^\p{L}\p{N}']+/u).filter((word) => word !== '' && word !== '0').length;
}

const WORDS_PER_MINUTE = 200;

export function readTime(text: string): number {
  return Math.ceil(wordCount(text) / WORDS_PER_MINUTE);
}
