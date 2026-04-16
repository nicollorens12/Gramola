import type { Metadata, ResolveOptions } from '../types';
import { parseYouTubeId } from '../detectProvider';
import { fetchJson } from '../fetchJson';

interface YouTubeOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

export async function resolveYouTube(
  url: string,
  opts: Required<Pick<ResolveOptions, 'timeoutMs' | 'fetchImpl'>>,
): Promise<Metadata | undefined> {
  const youtubeId = parseYouTubeId(url);
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const data = await fetchJson<YouTubeOEmbed>(oembedUrl, opts);
  if (!data) return undefined;

  return {
    provider: 'youtube',
    title: data.title?.trim() || url,
    artist: data.author_name?.trim(),
    thumbnailUrl: data.thumbnail_url,
    youtubeId,
    raw: data,
  };
}
