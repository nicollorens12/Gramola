'use client';

/**
 * Load the YouTube IFrame Player API script exactly once per page and resolve
 * a promise when `window.YT` is ready. Safe to call from many components;
 * only the first caller actually injects the script tag.
 */

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    config: {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

export interface YTPlayer {
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let readyPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return; // SSR: never resolves, never called.
    }
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };

    // Only inject the script once even if this module is imported twice.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-gramola-youtube-api]',
    );
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.gramolaYoutubeApi = 'true';
      document.head.appendChild(script);
    }
  });

  return readyPromise;
}
