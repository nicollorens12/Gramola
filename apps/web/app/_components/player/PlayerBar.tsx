'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePlayerStore } from './usePlayerStore';
import { YouTubeHost } from './YouTubeHost';
import { SourceEmbedHost } from './SourceEmbedHost';
import { cn } from '@/lib/cn';

/**
 * Persistent bottom player. Mounted in root layout — survives client-side
 * navigation, so music keeps playing as the user moves between feed and threads.
 *
 * Layout: thumbnail + title/artist on the left, play/pause (YouTube only) +
 * external-open on the right. The active host (YouTube iframe / source embed)
 * is rendered hidden or as a small visual cue inside the same bar.
 */
export function PlayerBar() {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const hasUserGesture = usePlayerStore((s) => s.hasUserGesture);
  const toggle = usePlayerStore((s) => s.toggle);
  const markGesture = usePlayerStore((s) => s.markGesture);

  // Global gesture listener — flips hasUserGesture on the first click/key/touch
  // anywhere on the page. Capture phase so we get it before other handlers might
  // stopPropagation.
  useEffect(() => {
    if (hasUserGesture) return;
    const handler = () => markGesture();
    window.addEventListener('pointerdown', handler, { capture: true, once: true });
    window.addEventListener('keydown', handler, { capture: true, once: true });
    return () => {
      window.removeEventListener('pointerdown', handler, { capture: true });
      window.removeEventListener('keydown', handler, { capture: true });
    };
  }, [hasUserGesture, markGesture]);

  if (!current) return <EmptyBar />;

  const isYouTube = current.playbackStrategy === 'youtube';
  const isSourceEmbed = current.playbackStrategy === 'source_embed';
  const isPlayable = isYouTube || isSourceEmbed;

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-ink-faint/70 bg-canvas-1/95 backdrop-blur-xl',
        'shadow-[0_-8px_30px_rgba(0,0,0,0.35)]',
      )}
      role="region"
      aria-label="Now playing"
    >
      <div className="mx-auto flex h-playerBar w-full max-w-3xl items-center gap-3 px-3">
        <Link
          href={`/thread/${current.postId}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <Thumb src={current.thumbnailUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-high">{current.title}</p>
            {current.artist ? (
              <p className="truncate text-xs text-ink-mid">{current.artist}</p>
            ) : null}
          </div>
        </Link>

        {/* Hidden hosts — YouTubeHost returns a tiny iframe, SourceEmbedHost renders the embed. */}
        <div className="hidden sm:block">
          {isYouTube ? <YouTubeHost /> : isSourceEmbed ? <SourceEmbedHost /> : null}
        </div>

        <div className="flex items-center gap-2">
          {!hasUserGesture && isYouTube ? (
            <button
              type="button"
              onClick={markGesture}
              className="rounded-full border border-accent/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-canvas-0"
            >
              Tap to unmute
            </button>
          ) : null}

          {isYouTube ? (
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="grid h-10 w-10 place-items-center rounded-full bg-accent text-canvas-0 transition-transform hover:scale-105"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          ) : null}

          {current.sourceUrl ? (
            <a
              href={current.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ink-faint px-3 py-1.5 text-xs text-ink-mid transition-colors hover:border-accent/60 hover:text-accent"
              aria-label="Open original source"
            >
              ↗
            </a>
          ) : null}

          {!isPlayable ? <NotPlayableBadge /> : null}
        </div>
      </div>
    </div>
  );
}

function EmptyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-faint/40 bg-canvas-1/80 backdrop-blur-xl">
      <div className="mx-auto flex h-playerBar w-full max-w-3xl items-center px-4 text-xs text-ink-low">
        Nothing playing. Open a thread.
      </div>
    </div>
  );
}

function Thumb({ src }: { src?: string }) {
  if (!src) {
    return (
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-canvas-3 text-ink-low">
        ♪
      </div>
    );
  }
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-canvas-3">
      <Image src={src} alt="" fill className="object-cover" sizes="48px" />
    </div>
  );
}

function NotPlayableBadge() {
  return (
    <span className="rounded-full border border-ink-faint px-2.5 py-1 text-[10px] uppercase tracking-widest text-ink-mid">
      preview only
    </span>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <path d="M3 2v10l9-5-9-5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <rect x="3" y="2" width="3" height="10" rx="1" />
      <rect x="8" y="2" width="3" height="10" rx="1" />
    </svg>
  );
}
