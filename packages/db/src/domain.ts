/**
 * Domain-level types. Kept separate from the Supabase-generated `Database` type
 * (which describes raw column shapes) so app code can depend on stable names
 * even if the schema picks up columns we don't want to surface yet.
 */

export type Provider =
  | 'youtube'
  | 'spotify'
  | 'apple_music'
  | 'bandcamp'
  | 'soundcloud'
  | 'other'
  | 'none';

export type PlaybackStrategy = 'youtube' | 'source_embed' | 'none';

export interface Post {
  id: string;
  title: string;
  comment: string | null;
  sourceUrl: string | null;
  provider: Provider;
  thumbnailUrl: string | null;
  artist: string | null;
  durationSeconds: number | null;
  youtubeId: string | null;
  embedHtml: string | null;
  playbackStrategy: PlaybackStrategy;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  handle: string;
  body: string;
  createdAt: string;
}

/** What the player bar needs to play a track. Derived from Post. */
export interface Track {
  postId: string;
  provider: Provider;
  title: string;
  artist?: string;
  thumbnailUrl?: string;
  youtubeId?: string | null;
  embedHtml?: string | null;
  sourceUrl?: string | null;
  playbackStrategy: PlaybackStrategy;
}

export function postToTrack(post: Post): Track {
  return {
    postId: post.id,
    provider: post.provider,
    title: post.title,
    artist: post.artist ?? undefined,
    thumbnailUrl: post.thumbnailUrl ?? undefined,
    youtubeId: post.youtubeId,
    embedHtml: post.embedHtml,
    sourceUrl: post.sourceUrl,
    playbackStrategy: post.playbackStrategy,
  };
}
