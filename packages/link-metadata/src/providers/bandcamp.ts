import type { Metadata, ResolveOptions } from '../types';
import { fetchJson } from '../fetchJson';

interface BandcampOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

export async function resolveBandcamp(
  url: string,
  opts: Required<Pick<ResolveOptions, 'timeoutMs' | 'fetchImpl'>>,
): Promise<Metadata | undefined> {
  const oembedUrl = `https://bandcamp.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  const data = await fetchJson<BandcampOEmbed>(oembedUrl, opts);
  if (!data?.title) return undefined;

  return {
    provider: 'bandcamp',
    title: data.title.trim(),
    artist: data.author_name?.trim(),
    thumbnailUrl: data.thumbnail_url,
    embedHtml: data.html,
    raw: data,
  };
}
