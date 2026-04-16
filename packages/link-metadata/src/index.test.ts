import { describe, expect, it, vi } from 'vitest';
import { resolveMetadata } from './index';

/**
 * Test-friendly fetch that serves canned JSON responses per URL pattern.
 * Any URL not matched falls through to a 404.
 */
function makeFetch(
  table: Array<{ match: RegExp; status?: number; body?: unknown; finalUrl?: string }>,
): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    for (const row of table) {
      if (row.match.test(url)) {
        return new Response(row.body ? JSON.stringify(row.body) : null, {
          status: row.status ?? 200,
          headers: { 'content-type': 'application/json' },
          // NOTE: Response.url is readonly and can't be spoofed here; we rely on
          // fetchImpl.url only for shortener expansion which our tests avoid.
        });
      }
    }
    return new Response(null, { status: 404 });
  }) as typeof fetch;
}

describe('resolveMetadata', () => {
  it('resolves a YouTube URL via oEmbed', async () => {
    const fetchImpl = makeFetch([
      {
        match: /youtube\.com\/oembed/,
        body: {
          title: 'Never Gonna Give You Up',
          author_name: 'Rick Astley',
          thumbnail_url: 'https://i.ytimg.com/x.jpg',
        },
      },
    ]);

    const meta = await resolveMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      fetchImpl,
      timeoutMs: 1000,
    });

    expect(meta.provider).toBe('youtube');
    expect(meta.title).toBe('Never Gonna Give You Up');
    expect(meta.artist).toBe('Rick Astley');
    expect(meta.youtubeId).toBe('dQw4w9WgXcQ');
  });

  it('falls back to URL-parsed youtubeId when oEmbed fails', async () => {
    const fetchImpl = makeFetch([{ match: /youtube\.com\/oembed/, status: 500 }]);

    const meta = await resolveMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      fetchImpl,
      timeoutMs: 1000,
    });

    expect(meta.provider).toBe('youtube');
    expect(meta.youtubeId).toBe('dQw4w9WgXcQ');
  });

  it('resolves a Spotify URL via oEmbed', async () => {
    const fetchImpl = makeFetch([
      {
        match: /spotify\.com\/oembed/,
        body: { title: 'Some Track', thumbnail_url: 'https://i.scdn.co/x.jpg' },
      },
    ]);

    const meta = await resolveMetadata('https://open.spotify.com/track/abcdef', {
      fetchImpl,
      timeoutMs: 1000,
    });

    expect(meta.provider).toBe('spotify');
    expect(meta.title).toBe('Some Track');
  });

  it('resolves a Bandcamp URL and keeps embed_html', async () => {
    const fetchImpl = makeFetch([
      {
        match: /bandcamp\.com\/oembed/,
        body: {
          title: 'Album Title',
          author_name: 'Some Band',
          thumbnail_url: 'https://f4.bcbits.com/x.jpg',
          html: '<iframe src="https://bandcamp.com/EmbeddedPlayer/album=1"></iframe>',
        },
      },
    ]);

    const meta = await resolveMetadata('https://someband.bandcamp.com/album/foo', {
      fetchImpl,
      timeoutMs: 1000,
    });

    expect(meta.provider).toBe('bandcamp');
    expect(meta.embedHtml).toContain('iframe');
  });

  it('resolves an Apple Music URL via iTunes Search lookup', async () => {
    const fetchImpl = makeFetch([
      {
        match: /itunes\.apple\.com\/lookup/,
        body: {
          resultCount: 1,
          results: [
            {
              trackName: 'Song Name',
              artistName: 'Some Artist',
              artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/100x100.jpg',
              trackTimeMillis: 180_000,
            },
          ],
        },
      },
    ]);

    const meta = await resolveMetadata(
      'https://music.apple.com/us/album/song-name/123?i=456',
      { fetchImpl, timeoutMs: 1000 },
    );

    expect(meta.provider).toBe('apple_music');
    expect(meta.title).toBe('Song Name');
    expect(meta.artist).toBe('Some Artist');
    expect(meta.durationSeconds).toBe(180);
  });

  it('returns a default-shape metadata when everything fails', async () => {
    const fetchImpl = makeFetch([]); // nothing matches → all 404

    const meta = await resolveMetadata('https://unknown.example.com/path/to/thing', {
      fetchImpl,
      timeoutMs: 500,
    });

    // OpenGraph fallback dynamically imports unfurl.js and hits the real network,
    // which would fail in test. The resolver still has to return something usable.
    expect(meta.title.length).toBeGreaterThan(0);
    expect(meta.provider).toMatch(/^(other|none)$/);
  });
});
