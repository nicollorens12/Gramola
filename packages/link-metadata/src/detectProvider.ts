import type { Provider } from './types';

/**
 * Classify a URL by hostname. Returns `'other'` for hosts we don't recognize,
 * and throws on malformed URLs (callers should catch and treat as `'other'`).
 */
export function detectProvider(url: string): Provider {
  const host = new URL(url).hostname.toLowerCase();

  if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'youtube';
  if (host === 'open.spotify.com' || host.endsWith('.spotify.com') || host === 'spoti.fi') {
    return 'spotify';
  }
  if (host === 'music.apple.com' || host === 'itunes.apple.com' || host === 'apple.co') {
    return 'apple_music';
  }
  if (host.endsWith('.bandcamp.com') || host === 'bandcamp.com') return 'bandcamp';
  if (host === 'soundcloud.com' || host === 'snd.sc' || host === 'on.soundcloud.com') {
    return 'soundcloud';
  }
  return 'other';
}

/** Parse the 11-character YouTube video id from a URL. Returns undefined if not found. */
export function parseYouTubeId(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return isYouTubeId(id) ? id : undefined;
    }
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v && isYouTubeId(v)) return v;
      // /shorts/<id> or /embed/<id>
      const match = u.pathname.match(/^\/(?:shorts|embed|v)\/([A-Za-z0-9_-]{11})/);
      if (match && isYouTubeId(match[1])) return match[1];
    }
  } catch {
    /* fall through */
  }
  return undefined;
}

function isYouTubeId(s: string | undefined): s is string {
  return !!s && /^[A-Za-z0-9_-]{11}$/.test(s);
}
