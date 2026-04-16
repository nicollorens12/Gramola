import Link from 'next/link';

export default function ThreadNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-3xl text-ink-high">Thread not found</p>
      <p className="text-ink-mid">It may have been removed or never existed.</p>
      <Link
        href="/"
        className="rounded-full border border-accent/40 px-4 py-2 text-sm text-accent transition-colors hover:bg-accent hover:text-canvas-0"
      >
        Back to the feed
      </Link>
    </div>
  );
}
