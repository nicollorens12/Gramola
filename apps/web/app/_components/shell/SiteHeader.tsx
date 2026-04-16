import Link from 'next/link';
import { clientEnvVars } from '@/lib/env';
import { HandleBadge } from '@/app/_components/identity/HandleBadge';

/**
 * Top nav. Server component — the handle badge it embeds hydrates client-side.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-faint/60 bg-canvas-0/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display text-2xl leading-none tracking-tight text-ink-high hover:text-accent transition-colors"
        >
          {clientEnvVars.NEXT_PUBLIC_SITE_NAME}
        </Link>
        <HandleBadge />
      </div>
    </header>
  );
}
