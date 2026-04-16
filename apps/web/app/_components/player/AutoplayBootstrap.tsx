'use client';

import { useEffect, useRef } from 'react';
import type { Track } from '@gramola/db';
import { usePlayerStore } from './usePlayerStore';

interface AutoplayBootstrapProps {
  track: Track;
}

/**
 * On home-page mount, seed the player with the newest post's track.
 * Guarded by a ref so Strict Mode's double-effect doesn't trigger twice.
 *
 * We DON'T force isPlaying=true here — the `play()` action already does that,
 * but the YouTube player loads muted (see YouTubeHost) so the user perceives
 * silence until they gesture. That's the browser-policy-compatible path.
 */
export function AutoplayBootstrap({ track }: AutoplayBootstrapProps) {
  const play = usePlayerStore((s) => s.play);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    // Only autoplay if nothing is currently playing — respects the user's
    // existing playback when they navigate back to home.
    const store = usePlayerStore.getState();
    if (store.current) return;
    play(track);
  }, [play, track]);

  return null;
}
