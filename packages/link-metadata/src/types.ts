export type Provider =
  | 'youtube'
  | 'spotify'
  | 'apple_music'
  | 'bandcamp'
  | 'soundcloud'
  | 'other'
  | 'none';

export interface Metadata {
  provider: Provider;
  title: string;
  artist?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  /** Only populated when provider === 'youtube' and we parsed the id from the URL. */
  youtubeId?: string;
  /** oEmbed iframe HTML for providers that allow inline playback (SoundCloud, Bandcamp). */
  embedHtml?: string;
  /** Raw provider response for forensic debugging. */
  raw?: unknown;
}

export interface ResolveOptions {
  /** Per-request timeout applied to every outbound fetch. Default 5000ms. */
  timeoutMs?: number;
  /** Inject a custom fetch (tests, Node fetch with proxy, etc.). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}
