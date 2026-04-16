import type { Database } from '@gramola/db/types';
import type { Post, Comment } from '@gramola/db';

type PostRow = Database['public']['Tables']['posts']['Row'];
type CommentRow = Database['public']['Tables']['comments']['Row'];

/**
 * Convert a Supabase row to our camelCase domain type. Centralized so RSC
 * and Realtime bridges produce identical shapes.
 */
export function rowToPost(r: Pick<PostRow,
  | 'id'
  | 'title'
  | 'comment'
  | 'source_url'
  | 'provider'
  | 'thumbnail_url'
  | 'artist'
  | 'duration_seconds'
  | 'youtube_id'
  | 'embed_html'
  | 'playback_strategy'
  | 'created_at'
>): Post {
  return {
    id: r.id,
    title: r.title,
    comment: r.comment,
    sourceUrl: r.source_url,
    provider: r.provider,
    thumbnailUrl: r.thumbnail_url,
    artist: r.artist,
    durationSeconds: r.duration_seconds,
    youtubeId: r.youtube_id,
    embedHtml: r.embed_html,
    playbackStrategy: r.playback_strategy,
    createdAt: r.created_at,
  };
}

export function rowToComment(
  r: Pick<CommentRow, 'id' | 'post_id' | 'handle' | 'body' | 'created_at'>,
): Comment {
  return {
    id: r.id,
    postId: r.post_id,
    handle: r.handle,
    body: r.body,
    createdAt: r.created_at,
  };
}
