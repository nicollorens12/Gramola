import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@gramola/db';
import { ProviderBadge } from '@/app/_components/feed/ProviderBadge';
import { PlayButton } from '@/app/_components/player/PlayButton';
import { postToTrack } from '@gramola/db';
import { cn } from '@/lib/cn';

interface ThreadHeaderProps {
  post: Post;
}

export function ThreadHeader({ post }: ThreadHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs text-ink-mid">
        <Link href="/" className="hover:text-accent">
          ← back
        </Link>
        <span className="text-ink-low">·</span>
        <ProviderBadge provider={post.provider} />
        <span className="text-ink-low">·</span>
        <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString()}</time>
      </div>
      <div className="flex gap-4">
        <Thumbnail post={post} />
        <div className="flex min-w-0 flex-col justify-between gap-2">
          <div>
            <h1 className="font-display text-balance text-2xl leading-tight text-ink-high md:text-3xl">
              {post.title}
            </h1>
            {post.artist ? (
              <p className="mt-1 text-sm text-ink-mid">{post.artist}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <PlayButton track={postToTrack(post)} label="Play" />
            {post.sourceUrl ? (
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-ink-faint px-3 py-1.5 text-xs text-ink-mid transition-colors hover:border-accent/60 hover:text-accent"
              >
                Open original
              </a>
            ) : null}
          </div>
        </div>
      </div>
      {post.comment ? (
        <p className="whitespace-pre-wrap rounded-xl border border-ink-faint/70 bg-canvas-1 p-4 text-sm text-ink-high">
          {post.comment}
        </p>
      ) : null}
    </header>
  );
}

function Thumbnail({ post }: { post: Post }) {
  const base = 'h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-ink-faint bg-canvas-2 md:h-36 md:w-36';
  if (!post.thumbnailUrl) {
    return <div className={cn(base, 'flex items-center justify-center text-ink-low')}>♪</div>;
  }
  return (
    <div className={base}>
      <Image
        src={post.thumbnailUrl}
        alt=""
        width={256}
        height={256}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
