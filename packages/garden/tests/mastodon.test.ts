// The Mastodon loader (lib/mastodon.ts) on made-up statuses: which posts it keeps, their ids, titles, HTML and
// media, the paging, and that a build makes the collection match the timeline (new, edited and deleted posts).
import { describe, expect, it } from 'vitest';
import {
  fetchStatuses,
  idsOf,
  mastodonLoader,
  titleOf,
  toNotes,
  type MastodonOptions,
  type Status,
} from '../lib/mastodon.ts';

const options: MastodonOptions = {
  instance: 'example.social',
  acct: 'me',
  timeZone: 'Asia/Kuala_Lumpur',
  skipTag: 'nosite',
  siteUrl: 'https://example.com',
};

const status = (over: Partial<Status> & { id: string }): Status => ({
  created_at: '2025-01-16T05:14:32.897Z',
  edited_at: null,
  in_reply_to_id: null,
  in_reply_to_account_id: null,
  account: { id: '42' },
  reblog: null,
  visibility: 'public',
  spoiler_text: '',
  content: '<p>Hello there. Second sentence.</p>',
  url: `https://example.social/@me/${over.id}`,
  uri: `https://example.social/users/me/statuses/${over.id}`,
  tags: [],
  media_attachments: [],
  replies_count: 0,
  reblogs_count: 0,
  favourites_count: 0,
  ...over,
});

describe('which posts are notes', () => {
  it('keeps public posts and leaves out replies, boosts, other visibilities, content warnings and #nosite', async () => {
    const notes = await toNotes(
      [
        status({ id: '1' }),
        status({ id: '2', created_at: '2025-01-15T00:00:00Z', in_reply_to_id: '9' }),
        status({ id: '3', created_at: '2025-01-14T00:00:00Z', reblog: {} }),
        status({ id: '4', created_at: '2025-01-13T00:00:00Z', visibility: 'unlisted' }),
        status({ id: '5', created_at: '2025-01-12T00:00:00Z', spoiler_text: 'Spoilers' }),
        status({ id: '6', created_at: '2025-01-11T00:00:00Z', tags: [{ name: 'NoSite' }] }),
      ],
      options,
    );
    expect(notes.map((n) => n.data.url)).toEqual(['https://example.social/@me/1']);
  });
});

describe('threads', () => {
  it('makes a thread of the author’s replies one note, and leaves out replies to or from anyone else', async () => {
    const notes = await toNotes(
      [
        status({ id: '1', created_at: '2025-01-16T05:14:00Z', content: '<p>One.</p>', replies_count: 2 }),
        status({
          id: '2',
          created_at: '2025-01-16T05:15:00Z',
          content: '<p>Two.</p>',
          in_reply_to_id: '1',
          in_reply_to_account_id: '42',
          visibility: 'unlisted',
          edited_at: '2025-01-17T00:00:00Z',
          replies_count: 1,
          media_attachments: [{ type: 'image', url: 'https://files.example.social/a.jpg', description: 'A' }],
        }),
        status({
          id: '3',
          created_at: '2025-01-16T05:16:00Z',
          content: '<p>Three.</p>',
          in_reply_to_id: '2',
          in_reply_to_account_id: '42',
        }),
        status({
          id: '4',
          created_at: '2025-01-16T05:17:00Z',
          content: '<p>Someone else.</p>',
          in_reply_to_id: '1',
          in_reply_to_account_id: '42',
          account: { id: '7' },
        }),
        status({
          id: '5',
          created_at: '2025-01-16T05:18:00Z',
          content: '<p>To someone else.</p>',
          in_reply_to_id: '99',
          in_reply_to_account_id: '7',
        }),
      ],
      options,
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]!.body).toBe('One.\n\nTwo.\n\nThree.');
    expect(notes[0]!.data).toMatchObject({ type: 'photo', updated: '2025-01-17T00:00:00Z', replies: 1 });
    expect(notes[0]!.data.media).toHaveLength(1);
  });
});

describe('ids', () => {
  it('is the date and minute in the time zone, a second post in that minute with its second', () => {
    const ids = idsOf(
      [
        status({ id: '20', created_at: '2025-01-16T05:14:40Z' }),
        status({ id: '10', created_at: '2025-01-16T05:14:02Z' }),
        status({ id: '30', created_at: '2025-12-31T16:30:00Z' }),
      ],
      'Asia/Kuala_Lumpur',
    );
    expect(Object.fromEntries(ids)).toEqual({
      '10': '2025-01-16-1314',
      '20': '2025-01-16-1314-40',
      '30': '2026-01-01-0030',
    });
  });
});

describe('a note', () => {
  it('takes its title from the first line of a post written in lines', async () => {
    const [note] = await toNotes(
      [status({ id: '1', content: '<p>Thoughts that kept me sane <br />Do things because you can.</p>' })],
      options,
    );
    expect(note!.data.title).toBe('Thoughts that kept me sane');
    expect(note!.body).toBe('Thoughts that kept me sane \nDo things because you can.');
  });

  it('takes its title from the first sentence, cut at a word', () => {
    expect(titleOf('Hello there. Second sentence.')).toBe('Hello there');
    expect(titleOf('Short, no stop')).toBe('Short, no stop');
    expect(
      titleOf('My simple desire to access Doom Emacs on my mobile phone sent me down a deep and dark rabbit hole'),
    ).toBe('My simple desire to access Doom Emacs on my mobile phone…');
    expect(titleOf('')).toBeNull();
  });

  it('has the HTML as the garden writes it, its text, opening paragraphs, dates and counts', async () => {
    const [note] = await toNotes(
      [
        status({
          id: '1',
          edited_at: '2025-01-17T00:00:00Z',
          content:
            '<p>Read <a href="https://example.org/a/very/long/path" target="_blank" rel="nofollow noopener" translate="no"><span class="invisible">https://</span><span class="ellipsis">example.org/a/very</span><span class="invisible">/long/path</span></a> now.</p><p>Then this.</p>',
          replies_count: 2,
          favourites_count: 5,
        }),
      ],
      options,
    );
    expect(note!.html).toBe(
      '<p>Read <a href="https://example.org/a/very/long/path" class="external-link"><span class="ellipsis">example.org/a/very…</span></a> now.</p><p>Then this.</p>',
    );
    expect(note!.body).toBe('Read example.org/a/very… now.\n\nThen this.');
    expect(note!.paragraphs).toEqual(['Read example.org/a/very… now.', 'Then this.']);
    expect(note!.data).toMatchObject({
      title: 'Read example.org/a/very… now',
      date: '2025-01-16T05:14:32.897Z',
      updated: '2025-01-17T00:00:00Z',
      type: 'text',
      replies: 2,
      boosts: 0,
      favourites: 5,
    });
  });

  it('is a photo with its pictures and their alt text; a picture alone is titled by its date', async () => {
    const [note] = await toNotes(
      [
        status({
          id: '1',
          content: '',
          media_attachments: [
            {
              type: 'image',
              url: 'https://files.example.social/a.jpg',
              description: 'A notebook',
              meta: { original: { width: 1600, height: 1200 } },
            },
            { type: 'gifv', url: 'https://files.example.social/b.mp4', description: null, meta: null },
            { type: 'audio', url: 'https://files.example.social/c.mp3', description: null },
          ],
        }),
      ],
      options,
    );
    expect(note!.data.type).toBe('photo');
    expect(note!.data.title).toBe('Photo, 16 January 2025');
    expect(note!.data.media).toEqual([
      { kind: 'image', src: 'https://files.example.social/a.jpg', alt: 'A notebook', width: 1600, height: 1200 },
      { kind: 'video', src: 'https://files.example.social/b.mp4', alt: '', width: null, height: null },
    ]);
  });
});

/** A server holding `timeline`, answering the account lookup and the statuses 40 at a time. */
const server =
  (timeline: () => Status[]): typeof fetch =>
  async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/accounts/lookup')) return Response.json({ id: '42' });
    const maxId = url.searchParams.get('max_id');
    const older = timeline().filter((s) => !maxId || BigInt(s.id) < BigInt(maxId));
    return Response.json(older.slice(0, Number(url.searchParams.get('limit'))));
  };

describe('reading the timeline', () => {
  it('pages through every status', async () => {
    const timeline = Array.from({ length: 95 }, (_, i) => status({ id: String(1000 - i) }));
    const statuses = await fetchStatuses(options, { fetcher: server(() => timeline) });
    expect(statuses.length).toBe(95);
  });

  it('fails on an error from the server', async () => {
    let calls = 0;
    const failing: typeof fetch = async () => {
      calls++;
      return new Response('', { status: 503, statusText: 'Service Unavailable' });
    };
    await expect(fetchStatuses(options, { fetcher: failing, retryDelay: 0 })).rejects.toThrow('503');
    expect(calls).toBe(4);
  });

  it('asks again when rate-limited, and does not ask again when the account is not found', async () => {
    let calls = 0;
    const timeline = [status({ id: '1' })];
    const busyOnce: typeof fetch = async (input) => {
      if (calls++ === 0) return new Response('', { status: 429 });
      return server(() => timeline)(input);
    };
    expect(await fetchStatuses(options, { fetcher: busyOnce, retryDelay: 0 })).toHaveLength(1);
    let missing = 0;
    const notFound: typeof fetch = async () => {
      missing++;
      return new Response('', { status: 404 });
    };
    await expect(fetchStatuses(options, { fetcher: notFound, retryDelay: 0 })).rejects.toThrow('404');
    expect(missing).toBe(1);
  });
});

describe('the loader', () => {
  /** Astro's store, enough of it: entries by id, set (false when the digest is unchanged) and delete. */
  const store = () => {
    const entries = new Map<string, { data: Record<string, unknown>; digest?: string | number; rendered?: unknown }>();
    return {
      entries,
      keys: () => [...entries.keys()],
      delete: (id: string) => void entries.delete(id),
      set: ({ id, ...rest }: { id: string; data: Record<string, unknown>; digest?: string | number }) => {
        if (entries.get(id)?.digest === rest.digest) return false;
        entries.set(id, rest);
        return true;
      },
    };
  };

  it('makes the collection match the timeline: new posts added, edited ones changed, deleted ones removed', async () => {
    let timeline = [
      status({ id: '3', created_at: '2025-03-01T00:00:00Z', content: '<p>Third.</p>' }),
      status({ id: '2', created_at: '2025-02-01T00:00:00Z', content: '<p>Second.</p>' }),
      status({ id: '1', created_at: '2025-01-01T00:00:00Z', content: '<p>First.</p>' }),
    ];
    const s = store();
    const realFetch = globalThis.fetch;
    globalThis.fetch = server(() => timeline);
    try {
      const loader = mastodonLoader(options);
      const context = {
        store: s,
        logger: { info: () => {}, warn: () => {} },
        parseData: async ({ data }: { data: Record<string, unknown> }) => data,
        generateDigest: (d: unknown) => JSON.stringify(d),
      } as unknown as Parameters<typeof loader.load>[0];
      await loader.load(context);
      expect(s.keys().sort()).toEqual(['2025-01-01-0800', '2025-02-01-0800', '2025-03-01-0800']);

      timeline = [
        status({ id: '4', created_at: '2025-04-01T00:00:00Z', content: '<p>Fourth.</p>' }),
        status({
          id: '3',
          created_at: '2025-03-01T00:00:00Z',
          content: '<p>Third, edited.</p>',
          edited_at: '2025-03-02T00:00:00Z',
        }),
        status({ id: '1', created_at: '2025-01-01T00:00:00Z', content: '<p>First.</p>' }),
      ];
      await loader.load(context);
      expect(s.keys().sort()).toEqual(['2025-01-01-0800', '2025-03-01-0800', '2025-04-01-0800']);
      expect(s.entries.get('2025-03-01-0800')!.data.title).toBe('Third, edited');
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
