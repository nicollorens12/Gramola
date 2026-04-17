interface YTSearchResponse {
  items?: Array<{ id?: { videoId?: string } }>;
  error?: { code?: number; errors?: Array<{ reason?: string }> };
}

/**
 * Resolve "artist - track" to a YouTube video id via the Data API v3 `search` endpoint.
 *
 * Returns `null` on any failure (no key, zero results, quota exhausted, network).
 * The caller degrades gracefully: the post is still created, it just won't have
 * inline playback for that paid-source provider.
 */
export async function resolveYouTubeId(
  query: { artist?: string; title: string },
  apiKey: string | undefined,
): Promise<string | null> {
  if (!apiKey) return null;

  const q = [query.artist, query.title].filter(Boolean).join(' - ').trim();
  if (!q) return null;

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('q', q);
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const body = (await res.json()) as YTSearchResponse;

    if (!res.ok) {
      const reasons = body.error?.errors?.map((e) => e.reason).join(',');
      console.warn('[youtube-resolve]', res.status, reasons);
      return null;
    }

    return body.items?.[0]?.id?.videoId ?? null;
  } catch (err) {
    console.warn('[youtube-resolve] network error', err);
    return null;
  }
}
