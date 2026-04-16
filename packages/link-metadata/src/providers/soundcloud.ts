import type { Metadata, ResolveOptions } from '../types';
import { fetchJson } from '../fetchJson';

interface SoundCloudOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  /** Iframe HTML we inject verbatim (after sanitization) for inline playback. */
  html?: string;
}

export async function resolveSoundCloud(
  url: string,
  opts: Required<Pick<ResolveOptions, 'timeoutMs' | 'fetchImpl'>>,
): Promise<Metadata | undefined> {
  const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  const data = await fetchJson<SoundCloudOEmbed>(oembedUrl, opts);
  if (!data?.title) return undefined;

  return {
    provider: 'soundcloud',
    title: data.title.trim(),
    artist: data.author_name?.trim(),
    thumbnailUrl: data.thumbnail_url,
    embedHtml: data.html,
    raw: data,
  };
}
