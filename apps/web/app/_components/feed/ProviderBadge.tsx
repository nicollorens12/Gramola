import type { Provider } from '@gramola/db';
import { cn } from '@/lib/cn';

const LABEL: Record<Provider, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  bandcamp: 'Bandcamp',
  soundcloud: 'SoundCloud',
  other: 'Link',
  none: 'Thought',
};

export function ProviderBadge({
  provider,
  className,
}: {
  provider: Provider;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-ink-faint px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-ink-mid',
        className,
      )}
    >
      {LABEL[provider]}
    </span>
  );
}
