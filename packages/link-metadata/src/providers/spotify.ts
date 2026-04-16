import type { Metadata, ResolveOptions } from '../types';
import { fetchJson } from '../fetchJson';

interface SpotifyOEmbed {
  title?: string;
  thumbnail_url?: string;
  html?: string;
}

/**
 * Spotify's oEmbed returns only title + thumbnail (no artist/duration). That's OK
 * because the bot's YouTube-resolve step backfills playback; title alone is
 * enough to render the feed card.
 */
export async function resolveSpotify(
  url: string,
  opts: Required<Pick<ResolveOptions, 'timeoutMs' | 'fetchImpl'>>,
): Promise<Metadata | undefined> {
  const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
  const data = await fetchJson<SpotifyOEmbed>(oembedUrl, opts);
  if (!data?.title) return undefined;

  return {
    provider: 'spotify',
    title: data.title.trim(),
    thumbnailUrl: data.thumbnail_url,
    raw: data,
  };
}
