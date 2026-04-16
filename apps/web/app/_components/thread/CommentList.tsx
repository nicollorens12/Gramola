'use client';

import { useEffect } from 'react';
import type { Comment } from '@gramola/db';
import { useCommentStore } from './commentStore';
import { cn } from '@/lib/cn';

interface CommentListProps {
  postId: string;
  initialComments: Comment[];
}

export function CommentList({ postId, initialComments }: CommentListProps) {
  const setList = useCommentStore((s) => s.set);
  const comments = useCommentStore((s) => s.byPost[postId]);

  useEffect(() => {
    setList(postId, initialComments);
  }, [postId, initialComments, setList]);

  const list = comments ?? initialComments;

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-faint bg-canvas-1/50 px-4 py-6 text-sm text-ink-mid">
        No comments yet. Be the first.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {list.map((c) => (
        <li
          key={c.id}
          className={cn(
            'rounded-xl border border-ink-faint/70 bg-canvas-1 px-4 py-3',
            'transition-colors hover:border-ink-faint',
          )}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-xs text-accent">{c.handle}</span>
            <time
              dateTime={c.createdAt}
              className="text-[11px] uppercase tracking-widest text-ink-low"
              title={new Date(c.createdAt).toLocaleString()}
            >
              {relativeTime(c.createdAt)}
            </time>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-high">{c.body}</p>
        </li>
      ))}
    </ol>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
