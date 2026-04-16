'use client';

import { useState } from 'react';
import { useIdentityStore } from '@/app/_components/identity/identityStore';
import { useCommentStore } from './commentStore';

interface CommentComposerProps {
  postId: string;
}

/**
 * Simple one-shot composer. No Markdown — keeps the render path dumb (whitespace-pre-wrap)
 * and removes an entire injection surface. The handle shown is whatever the cookie says
 * right now; the server snapshots it at insert time so edits don't rewrite history.
 */
export function CommentComposer({ postId }: CommentComposerProps) {
  const identity = useIdentityStore((s) => s.identity);
  const addComment = useCommentStore((s) => s.add);

  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= 4000 && status !== 'sending';

  async function submit() {
    if (!canSend) return;
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, body: trimmed }),
      });
      if (res.status === 429) {
        throw new Error('Slow down — you’re commenting too fast.');
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error === 'post_not_found' ? 'This thread no longer exists.' : 'Could not send.');
      }
      const data = (await res.json()) as {
        id: string;
        postId: string;
        handle: string;
        body: string;
        createdAt: string;
      };
      // Optimistic local add — Realtime will also deliver it; the store dedupes.
      addComment(data);
      setBody('');
      setStatus('idle');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2 rounded-xl border border-ink-faint/70 bg-canvas-1 p-3"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-ink-mid">
          posting as <span className="text-accent">{identity?.handle ?? '…'}</span>
        </span>
        <span className="text-ink-low">{trimmed.length}/4000</span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
        }}
        placeholder="Say something about this track…"
        rows={3}
        className="w-full resize-none rounded-lg border border-ink-faint bg-canvas-2 px-3 py-2 text-sm text-ink-high outline-none placeholder:text-ink-low focus:border-accent focus:ring-2 focus:ring-accent/40"
        maxLength={4000}
      />
      {error ? <p className="text-xs text-hot">{error}</p> : null}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-canvas-0 transition-colors hover:bg-accent-soft disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Comment'}
        </button>
      </div>
    </form>
  );
}
