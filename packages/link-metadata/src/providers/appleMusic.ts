import type { Metadata, ResolveOptions } from '../types';
import { fetchJson } from '../fetchJson';

interface ITunesSearchResponse {
  resultCount?: number;
  results?: Array<{
    trackName?: string;
    collectionName?: string;
    artistName?: string;
    artworkUrl100?: string;
    artworkUrl512?: string;
    trackTimeMillis?: number;
  }>;
}

/**
 * Apple Music has no oEmbed. We reconstruct a search query from the URL's
 * path segments — `music.apple.com/<country>/album/<slug>/<id>?i=<songId>`
 * — and hit the iTunes Search API, which is free and unauthenticated.
 *
 * When `?i=<songId>` is present, we prefer that (it's a direct song lookup).
 * Otherwise we fall back to searching for the slug.
 */
export async function resolveAppleMusic(
  url: string,
  opts: Required<Pick<ResolveOptions, 'timeoutMs' | 'fetchImpl'>>,
): Promise<Metadata | undefined> {
  const { term, lookupId } = parseAppleUrl(url);

  // Prefer direct lookup by song id when we have one — always accurate.
  if (lookupId) {
    const direct = await fetchJson<ITunesSearchResponse>(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(lookupId)}&entity=song`,
      opts,
    );
    const r = direct?.results?.[0];
    if (r?.trackName) return toMetadata(r);
  }

  if (!term) return undefined;
  const search = await fetchJson<ITunesSearchResponse>(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`,
    opts,
  );
  const r = search?.results?.[0];
  if (!r?.trackName) return undefined;
  return toMetadata(r);
}

function toMetadata(r: NonNullable<ITunesSearchResponse['results']>[number]): Metadata {
  const artwork = r.artworkUrl512 ?? r.artworkUrl100?.replace('100x100', '512x512');
  return {
    provider: 'apple_music',
    title: r.trackName!.trim(),
    artist: r.artistName?.trim(),
    thumbnailUrl: artwork,
    durationSeconds: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : undefined,
    raw: r,
  };
}

function parseAppleUrl(url: string): { term?: string; lookupId?: string } {
  try {
    const u = new URL(url);
    const lookupId = u.searchParams.get('i') ?? undefined;
    // Path shape: /<country>/<type>/<slug>/<albumId>
    const parts = u.pathname.split('/').filter(Boolean);
    // Drop country + type; last meaningful segments form the search term.
    const slugParts = parts.slice(2, -1);
    const term = slugParts
      .map((p) => decodeURIComponent(p).replace(/-/g, ' '))
      .join(' ')
      .trim();
    return { term: term || undefined, lookupId };
  } catch {
    return {};
  }
}
