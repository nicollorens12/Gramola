'use client';

import { create } from 'zustand';
import type { Track } from '@gramola/db';

interface PlayerState {
  current: Track | null;
  /** Whether the user *wants* playback to happen. Distinct from actual host state. */
  isPlaying: boolean;
  /** True once any user gesture has occurred. Needed to unmute autoplay. */
  hasUserGesture: boolean;

  play: (track: Track, opts?: { replace?: boolean }) => void;
  toggle: () => void;
  markGesture: () => void;
  stop: () => void;
  setIsPlaying: (playing: boolean) => void;
}

/**
 * Global player state. One source of truth for:
 *   - which track is mounted (YouTube host vs source embed vs none)
 *   - whether playback is currently desired
 *   - whether the user has gestured (needed to unmute YouTube autoplay)
 *
 * Hosts subscribe via selectors (not full-store reads) to avoid re-render storms.
 */
export const usePlayerStore = create<PlayerState>((set, get) => ({
  current: null,
  isPlaying: false,
  hasUserGesture: false,

  play: (track, opts) => {
    const state = get();
    if (state.current?.postId === track.postId && !opts?.replace) {
      // Same track; just ensure we're playing.
      set({ isPlaying: true });
      return;
    }
    set({ current: track, isPlaying: true });
  },

  toggle: () => {
    const state = get();
    // A toggle by the user IS a gesture — enables unmuting on next tick.
    set({ isPlaying: !state.isPlaying, hasUserGesture: true });
  },

  markGesture: () => {
    if (!get().hasUserGesture) set({ hasUserGesture: true });
  },

  stop: () => set({ isPlaying: false }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
}));
