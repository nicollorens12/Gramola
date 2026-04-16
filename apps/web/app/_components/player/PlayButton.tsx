'use client';

import type { Track } from '@gramola/db';
import { usePlayerStore } from './usePlayerStore';
import { cn } from '@/lib/cn';

interface PlayButtonProps {
  track: Track;
  label?: string;
  className?: string;
}

/**
 * A Play button that hooks into the global player. Used on thread headers and
 * feed cards. Visually signals "now playing" when this track is current + playing.
 */
export function PlayButton({ track, label = 'Play', className }: PlayButtonProps) {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const play = usePlayerStore((s) => s.play);
  const toggle = usePlayerStore((s) => s.toggle);

  const isThisTrack = current?.postId === track.postId;
  const isActiveAndPlaying = isThisTrack && isPlaying;

  const disabled = track.playbackStrategy === 'none';

  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        if (isThisTrack) toggle();
        else play(track);
      }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        isActiveAndPlaying
          ? 'bg-accent text-canvas-0'
          : 'border border-accent/60 text-accent hover:bg-accent hover:text-canvas-0',
        disabled && 'cursor-not-allowed border-ink-faint bg-transparent text-ink-low hover:bg-transparent hover:text-ink-low',
        className,
      )}
      aria-label={isActiveAndPlaying ? 'Pause' : label}
    >
      <span className="text-xs leading-none">{isActiveAndPlaying ? '❚❚' : '▶'}</span>
      <span>{disabled ? 'No preview' : isActiveAndPlaying ? 'Playing' : label}</span>
    </button>
  );
}
