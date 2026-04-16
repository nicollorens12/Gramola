'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@gramola/db';
import { postToTrack } from '@gramola/db';
import { cn } from '@/lib/cn';
import { usePlayerStore } from '@/app/_components/player/usePlayerStore';
import { ProviderBadge } from './ProviderBadge';

interface PostCardProps {
  post: Post;
}

/**
 * Compact feed card. The card is a link to the thread; a small play affordance
 * on the thumbnail switches the current track without navigating, so people
 * can shuffle through previews from the feed.
 */
export function PostCard({ post }: PostCardProps) {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const play = usePlayerStore((s) => s.play);
  const toggle = usePlayerStore((s) => s.toggle);

  const isCurrent = current?.postId === post.id;
  const active = isCurrent && isPlaying;

  return (
    <article
      className={cn(
        'group relative flex gap-3 rounded-2xl border p-3 transition-colors',
        active
          ? 'border-accent/50 bg-accent/5 shadow-glow'
          : 'border-ink-faint/60 bg-canvas-1 hover:border-ink-faint',
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isCurrent) toggle();
          else play(postToTrack(post));
        }}
        disabled={post.playbackStrategy === 'none'}
        className={cn(
          'relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-canvas-2',
          'transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
          post.playbackStrategy !== 'none' && 'hover:scale-[1.02]',
        )}
        aria-label={active ? 'Pause' : 'Play'}
      >
        {post.thumbnailUrl ? (
          <Image src={post.thumbnailUrl} alt="" fill className="object-cover" sizes="80px" />
        ) : (
          <span className="grid h-full w-full place-items-center text-ink-low">♪</span>
        )}
        <span
          className={cn(
            'absolute inset-0 grid place-items-center bg-black/45 text-accent opacity-0 transition-opacity',
            post.playbackStrategy !== 'none' && 'group-hover:opacity-100',
            active && 'opacity-100',
          )}
        >
          {active ? <span className="text-lg">❚❚</span> : <span className="ml-1 text-lg">▶</span>}
        </span>
      </button>

      <Link href={`/thread/${post.id}`} className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <h3
            className={cn(
              'truncate font-display text-lg leading-tight text-ink-high',
              active && 'text-accent',
            )}
          >
            {post.title}
          </h3>
          {post.artist ? (
            <p className="truncate text-sm text-ink-mid">{post.artist}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-mid">
          <ProviderBadge provider={post.provider} />
          <span className="text-ink-low">·</span>
          <time dateTime={post.createdAt}>{relativeTime(post.createdAt)}</time>
          {post.comment ? (
            <>
              <span className="text-ink-low">·</span>
              <span className="truncate">{post.comment}</span>
            </>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}
