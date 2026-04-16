'use client';

import { useEffect, useRef } from 'react';
import type { Track } from '@gramola/db';
import { usePlayerStore } from './usePlayerStore';

interface ThreadAutoplayProps {
  track: Track;
}

/**
 * When a thread page mounts, ensure its track is the current one. If the same
 * track is already playing (e.g. the user clicked through from the feed while
 * that track was selected), we leave it alone — the player bar keeps going
 * seamlessly.
 */
export function ThreadAutoplay({ track }: ThreadAutoplayProps) {
  const play = usePlayerStore((s) => s.play);
  const hasRun = useRef<string | null>(null);

  useEffect(() => {
    if (hasRun.current === track.postId) return;
    hasRun.current = track.postId;

    const store = usePlayerStore.getState();
    if (store.current?.postId === track.postId) return;
    play(track);
  }, [play, track]);

  return null;
}
