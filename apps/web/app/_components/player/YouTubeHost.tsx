'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from './usePlayerStore';
import { loadYouTubeIframeApi, type YTPlayer } from './youtubeApi';

/**
 * Hidden YouTube IFrame player. There is ONE instance, kept across track changes
 * — we call `loadVideoById` to swap videos, which is ~10x cheaper than re-mounting
 * the iframe.
 *
 * Autoplay policy: first load starts muted. When `hasUserGesture` flips true
 * (after any click/keypress), we unmute. This is the only reliable way to get
 * cross-browser autoplay without a "click to play" wall on the very first visit.
 */
export function YouTubeHost() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const currentYouTubeId = useRef<string | null>(null);

  const youtubeId = usePlayerStore((s) =>
    s.current?.playbackStrategy === 'youtube' ? (s.current.youtubeId ?? null) : null,
  );
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const hasUserGesture = usePlayerStore((s) => s.hasUserGesture);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  // Mount the YT.Player once when this host first renders with a video id.
  useEffect(() => {
    if (!youtubeId || !containerRef.current || playerRef.current) return;

    let cancelled = false;
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        height: '90',
        width: '160',
        videoId: youtubeId,
        playerVars: {
          // Autoplay muted — then we unmute on gesture. This is how Twitch/YouTube home do it.
          autoplay: 1,
          mute: 1,
          playsinline: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: ({ target }) => {
            currentYouTubeId.current = youtubeId;
            if (usePlayerStore.getState().isPlaying) target.playVideo();
          },
          onStateChange: ({ data, target }) => {
            const YTState = target && (window.YT?.PlayerState ?? { PLAYING: 1, PAUSED: 2, ENDED: 0 });
            if (data === YTState.PLAYING) setIsPlaying(true);
            if (data === YTState.PAUSED) setIsPlaying(false);
            if (data === YTState.ENDED) setIsPlaying(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [youtubeId, setIsPlaying]);

  // Swap video when youtubeId changes and the player already exists.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !youtubeId) return;
    if (currentYouTubeId.current === youtubeId) return;
    player.loadVideoById(youtubeId);
    currentYouTubeId.current = youtubeId;
  }, [youtubeId]);

  // Reflect isPlaying changes back into the YouTube API.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isPlaying]);

  // Unmute once the user has gestured. We don't force-play on gesture — we just
  // stop muting so the currently-playing track becomes audible.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !hasUserGesture) return;
    if (player.isMuted()) player.unMute();
  }, [hasUserGesture]);

  // Destroy on unmount (switching away from youtube strategy).
  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      currentYouTubeId.current = null;
    };
  }, []);

  if (!youtubeId) return null;
  return (
    <div
      // Kept visible but tiny — YouTube's video box renders here. We could hide it,
      // but a thumbnail-sized player also acts as a visual cue that something's playing.
      className="overflow-hidden rounded-md bg-black"
      aria-hidden="true"
    >
      <div ref={containerRef} />
    </div>
  );
}
