// A content loader (Astro's Content Layer API) for a Mastodon account's public
// posts: every build reads the whole timeline and makes the collection match
// it, so a post written, edited or deleted there is one here too (create,
// update, delete; `store.set` skips a post whose digest has not changed).
// A post is kept when it is public, not a reply or a boost, has no content
// warning and no #nosite tag; the replies the author wrote to it, and to those,
// (a thread) are the rest of its note. Its id is its date and minute in the site's time
// zone (2025-01-16-1314), never only digits, so it cannot collide with /notes/2.
// The HTML is Mastodon's, run through the garden's external links and excerpt,
// so a note's links and description behave as a Markdown page's.
import type { Loader } from 'astro/loaders';
import type { Root } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { toString } from 'hast-util-to-string';
import { unified, type PluggableList } from 'unified';
import { SKIP, visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { externalLinks } from './markdown/index.ts';
import rehypeExcerpt from './markdown/rehype-excerpt.ts';

/** The fields of a status (https://docs.joinmastodon.org/entities/Status/) the loader reads. */
export type Status = {
  id: string;
  created_at: string;
  edited_at?: string | null;
  in_reply_to_id: string | null;
  in_reply_to_account_id: string | null;
  account: { id: string };
  reblog: unknown | null;
  visibility: string;
  spoiler_text: string;
  content: string;
  url: string | null;
  uri: string;
  tags: { name: string }[];
  media_attachments: {
    type: string;
    url: string;
    description: string | null;
    meta?: { original?: { width?: number; height?: number } } | null;
  }[];
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
};

export type MastodonOptions = {
  /** The account's server, `mastodon.social`. */
  instance: string;
  /** The account's handle on it, without the @. */
  acct: string;
  /** The time zone a note's address is written in (its date and minute). */
  timeZone: string;
  /** A post with this hashtag stays off the site. */
  skipTag?: string;
  /** The site's address: links to anywhere else are external links. */
  siteUrl: string;
};

/** A picture or video; its size is null when the server does not say (then <Image> reads it off the file). */
export type NoteMedia = {
  kind: 'image' | 'video';
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
};

/** A note as the loader stores it: the collection's data, its plain text and its HTML. */
export type Note = {
  id: string;
  data: {
    title: string;
    date: string;
    updated?: string;
    type: 'text' | 'photo';
    url: string;
    media: NoteMedia[];
    replies: number;
    boosts: number;
    favourites: number;
  };
  body: string;
  html: string;
  paragraphs: string[];
};

const TITLE_LENGTH = 60;

/** A post the site may show: no boost, no content warning, no skip tag. */
const shown = (s: Status, skipTag: string): boolean =>
  s.reblog === null &&
  s.spoiler_text.trim() === '' &&
  !s.tags.some((t) => t.name.toLowerCase() === skipTag.toLowerCase());

/** The posts that start a note: public, shown, and no reply. */
export const isNote = (s: Status, skipTag = 'nosite'): boolean =>
  s.visibility === 'public' && s.in_reply_to_id === null && shown(s, skipTag);

/**
 * Each note's posts, oldest first: a post that starts one, then every reply its author wrote to a post of the thread
 * (public or unlisted, as a client often posts a thread's replies), so a thread is one note.
 */
export function threadsOf(statuses: Status[], skipTag = 'nosite'): Status[][] {
  const oldestFirst = [...statuses].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const threads = new Map<string, Status[]>();
  const rootOf = new Map<string, string>();
  for (const s of oldestFirst) {
    if (isNote(s, skipTag)) {
      threads.set(s.id, [s]);
      rootOf.set(s.id, s.id);
      continue;
    }
    const root = s.in_reply_to_id ? rootOf.get(s.in_reply_to_id) : undefined;
    const thread = root ? threads.get(root) : undefined;
    if (
      !thread ||
      s.account.id !== thread[0]!.account.id ||
      s.in_reply_to_account_id !== s.account.id ||
      !['public', 'unlisted'].includes(s.visibility) ||
      !shown(s, skipTag)
    )
      continue;
    thread.push(s);
    rootOf.set(s.id, root!);
  }
  return [...threads.values()];
}

/** A moment's date, minute and second in a time zone: `2025-01-16-1314` and `32`. */
function minuteOf(iso: string, timeZone: string): { minute: string; second: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return { minute: `${parts.year}-${parts.month}-${parts.day}-${parts.hour}${parts.minute}`, second: parts.second! };
}

/**
 * Each post's id: its minute, the first post of a minute plain, a later one with its second (and the end of its
 * status id, if it shares that too).
 */
export function idsOf(statuses: Status[], timeZone: string): Map<string, string> {
  const ids = new Map<string, string>();
  const taken = new Set<string>();
  const oldestFirst = [...statuses].sort(
    (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
  for (const s of oldestFirst) {
    const { minute, second } = minuteOf(s.created_at, timeZone);
    let id = minute;
    if (taken.has(id)) id = `${minute}-${second}`;
    if (taken.has(id)) id = `${minute}-${second}-${s.id.slice(-4)}`;
    taken.add(id);
    ids.set(s.id, id);
  }
  return ids;
}

/**
 * Mastodon's link markup as the garden's: without what Mastodon's own CSS hides (the `invisible` parts of a URL; `…`
 * for a cut one), and without its `target` and `rel` (the garden's links open in place).
 */
function tidyLinks(tree: Root): void {
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName === 'a') {
      delete node.properties.target;
      delete node.properties.rel;
      delete node.properties.translate;
    }
    const classes = Array.isArray(node.properties.className) ? node.properties.className.map(String) : [];
    if (node.tagName === 'span' && classes.includes('invisible') && parent && index !== undefined) {
      parent.children.splice(index, 1);
      return [SKIP, index];
    }
    if (node.tagName === 'span' && classes.includes('ellipsis')) node.children.push({ type: 'text', value: '…' });
  });
}

/** A node's text, each `<br>` a line break (Mastodon writes a post's lines as `<br>`s in one paragraph). */
function textOf(node: Root | Root['children'][number]): string {
  const copy = structuredClone(node);
  visit(copy, 'element', (n, index, parent) => {
    if (n.tagName !== 'br' || !parent || index === undefined) return;
    parent.children.splice(index, 1, { type: 'text', value: '\n' });
    return [SKIP, index + 1];
  });
  return toString(copy as Parameters<typeof toString>[0]);
}

/** The first sentence or line, cut at a word to about 60 characters. */
export function titleOf(text: string): string | null {
  const first = text.split(/(?<=[.!?])\s|\n/)[0]?.trim() ?? '';
  if (first === '') return null;
  if (first.length <= TITLE_LENGTH) return first.replace(/[.]$/, '');
  const cut = first.slice(0, TITLE_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 20 ? cut.lastIndexOf(' ') : TITLE_LENGTH).replace(/[,;:.]$/, '')}…`;
}

const longDate = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

/** One thread (a post and its author's replies) as a note. */
export async function toNote(thread: Status[], id: string, options: MastodonOptions): Promise<Note> {
  const s = thread[0]!;
  const tree = fromHtml(thread.map((t) => t.content).join('\n'), { fragment: true });
  tidyLinks(tree);
  const file = new VFile();
  const processed = (await unified()
    .use(externalLinks(options.siteUrl) as PluggableList)
    .use(rehypeExcerpt)
    .run(tree, file)) as Root;
  const paragraphs =
    (file.data as { astro?: { frontmatter?: { paragraphs?: string[] } } }).astro?.frontmatter?.paragraphs ?? [];
  const texts = processed.children.map((n) => textOf(n).trim()).filter(Boolean);
  const body = texts.join('\n\n');
  const media: NoteMedia[] = thread
    .flatMap((t) => t.media_attachments)
    .filter((m) => ['image', 'gifv', 'video'].includes(m.type))
    .map((m) => ({
      kind: m.type === 'image' ? 'image' : 'video',
      src: m.url,
      alt: m.description ?? '',
      width: m.meta?.original?.width ?? null,
      height: m.meta?.original?.height ?? null,
    }));
  const type = media.length > 0 ? 'photo' : 'text';
  const edited = thread
    .map((t) => t.edited_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  const title =
    titleOf(texts[0] ?? '') ?? `${type === 'photo' ? 'Photo' : 'Note'}, ${longDate(s.created_at, options.timeZone)}`;
  return {
    id,
    data: {
      title,
      date: s.created_at,
      ...(edited ? { updated: edited } : {}),
      type,
      url: s.url ?? s.uri,
      media,
      // Every reply to the thread but the author's own that make it.
      replies: thread.reduce((n, t) => n + t.replies_count, 0) - (thread.length - 1),
      boosts: s.reblogs_count,
      favourites: s.favourites_count,
    },
    body,
    html: toHtml(processed),
    paragraphs,
  };
}

/** The notes the timeline holds, one per thread. */
export async function toNotes(statuses: Status[], options: MastodonOptions): Promise<Note[]> {
  const threads = threadsOf(statuses, options.skipTag);
  const ids = idsOf(
    threads.map((t) => t[0]!),
    options.timeZone,
  );
  return Promise.all(threads.map((t) => toNote(t, ids.get(t[0]!.id)!, options)));
}

type Fetching = { fetcher?: typeof fetch; retryDelay?: number };

/**
 * A JSON answer, asked again up to three times (after 2, 4 and 8 seconds) when the server is busy or rate-limits
 * (CI runners share addresses, and Mastodon limits requests without a token by address).
 */
async function getJson<T>(url: string | URL, { fetcher = fetch, retryDelay = 2000 }: Fetching): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetcher(url, { headers: { accept: 'application/json' } });
    if (response.ok) return (await response.json()) as T;
    const transient = response.status === 429 || response.status >= 500;
    if (!transient || attempt === 3)
      throw new Error(`Mastodon: ${url} answered ${response.status} ${response.statusText}.`);
    await new Promise((resolve) => setTimeout(resolve, retryDelay * 2 ** attempt));
  }
}

/** Every status of the account, newest first: the account's statuses, 40 at a time, older and older (`max_id`). */
export async function fetchStatuses(
  { instance, acct }: Pick<MastodonOptions, 'instance' | 'acct'>,
  fetching: Fetching = {},
): Promise<Status[]> {
  const api = `https://${instance}/api/v1`;
  const account = await getJson<{ id: string }>(`${api}/accounts/lookup?acct=${encodeURIComponent(acct)}`, fetching);
  const statuses: Status[] = [];
  let maxId: string | null = null;
  // 1,000 pages is 40,000 posts: a safeguard against a server that never answers with an empty page.
  for (let page = 0; page < 1000; page++) {
    const url = new URL(`${api}/accounts/${account.id}/statuses`);
    url.searchParams.set('limit', '40');
    // Replies too: a thread's are the rest of its note (threadsOf leaves out replies to anyone else).
    url.searchParams.set('exclude_reblogs', 'true');
    if (maxId) url.searchParams.set('max_id', maxId);
    const batch = await getJson<Status[]>(url, fetching);
    if (batch.length === 0) return statuses;
    statuses.push(...batch);
    maxId = batch.at(-1)!.id;
  }
  throw new Error(`Mastodon: @${acct}@${instance} has more statuses than the loader reads.`);
}

/**
 * The loader. In a build a failed fetch fails the build (a deploy never empties the notes); in `astro dev` it keeps
 * the notes it last read and says so.
 */
export function mastodonLoader(options: MastodonOptions): Loader {
  return {
    name: 'mastodon',
    load: async ({ store, logger, parseData, generateDigest }) => {
      let statuses: Status[];
      try {
        statuses = await fetchStatuses(options);
      } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
        logger.warn(`${(error as Error).message} Keeping the ${store.keys().length} notes read last time.`);
        return;
      }
      const notes = await toNotes(statuses, options);
      const keep = new Set(notes.map((n) => n.id));
      const removed = store.keys().filter((id) => !keep.has(id));
      for (const id of removed) store.delete(id);
      let changed = 0;
      for (const note of notes) {
        const data = await parseData({ id: note.id, data: note.data });
        const stored = store.set({
          id: note.id,
          data,
          body: note.body,
          rendered: { html: note.html, metadata: { frontmatter: { paragraphs: note.paragraphs } } },
          digest: generateDigest({ data: note.data, html: note.html }),
        });
        if (stored) changed++;
      }
      logger.info(
        `@${options.acct}@${options.instance}: ${notes.length} notes (${changed} new or changed, ${removed.length} removed).`,
      );
    },
  };
}
