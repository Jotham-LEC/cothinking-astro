// Statamic's `read_time` modifier: its word count (runs of letters, digits and
// apostrophes; PHP's array_filter also drops a lone "0") over the text with
// tags stripped, divided by 200 words a minute, rounded up.
export function wordCount(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, '');
  if (stripped.trim() === '') return 0;
  return stripped.split(/[^\p{L}\p{N}']+/u).filter((word) => word !== '' && word !== '0').length;
}

export function readTime(text: string, wordsPerMinute = 200): number {
  return Math.ceil(wordCount(text) / wordsPerMinute);
}
