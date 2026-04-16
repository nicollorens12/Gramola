import type { Metadata, ResolveOptions } from './types';
import { detectProvider, parseYouTubeId } from './detectProvider';
import { expandShortener } from './fetchJson';
import { resolveYouTube } from './providers/youtube';
import { resolveSpotify } from './providers/spotify';
import { resolveSoundCloud } from './providers/soundcloud';
import { resolveBandcamp } from './providers/bandcamp';
import { resolveAppleMusic } from './providers/appleMusic';
import { resolveOpenGraph } from './providers/openGraph';

export type { Metadata, Provider, ResolveOptions } from './types';
export { detectProvider, parseYouTubeId } from './detectProvider';

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Resolve metadata (title, artist, thumbnail, inline embed) for a URL.
 *
 * Strategy: detect provider by hostname → call provider-specific oEmbed/API
 * first → fall back to OpenGraph scraping → fall back to a default card.
 *
 * This function never throws. The default return always has a usable title
 * (even if it's just the URL hostname), so the caller can always create a post.
 */
export async function resolveMetadata(
  rawUrl: string,
  options: ResolveOptions = {},
): Promise<Metadata> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const opts = { timeoutMs, fetchImpl };

  // Expand shorteners first. `spoti.fi`/`apple.co` links detect as spotify/apple by
  // host but have no path, so oEmbed/iTunes won't work until they're expanded.
  const url = await expandShortener(rawUrl, opts);

  let provider;
  try {
    provider = detectProvider(url);
  } catch {
    return defaultMetadata(rawUrl);
  }

  let resolved: Metadata | undefined;

  switch (provider) {
    case 'youtube':
      resolved = await resolveYouTube(url, opts);
      break;
    case 'spotify':
      resolved = await resolveSpotify(url, opts);
      break;
    case 'soundcloud':
      resolved = await resolveSoundCloud(url, opts);
      break;
    case 'bandcamp':
      resolved = await resolveBandcamp(url, opts);
      break;
    case 'apple_music':
      resolved = await resolveAppleMusic(url, opts);
      break;
    default:
      resolved = undefined;
  }

  // YouTube IDs should always be populated when we recognize a YouTube URL,
  // even if oEmbed failed entirely.
  if (!resolved && provider === 'youtube') {
    const id = parseYouTubeId(url);
    if (id) {
      resolved = { provider: 'youtube', title: url, youtubeId: id };
    }
  }

  if (resolved) return resolved;

  // OpenGraph last-resort for any provider. We pass the classified provider
  // so the resulting Metadata still tells consumers which source this came from.
  const og = await resolveOpenGraph(url, provider, opts);
  if (og) return og;

  return defaultMetadata(url, provider);
}

function defaultMetadata(url: string, provider: import('./types').Provider = 'other'): Metadata {
  let title = url;
  try {
    const u = new URL(url);
    title = `${u.hostname}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    /* keep raw url */
  }
  return { provider, title };
}
