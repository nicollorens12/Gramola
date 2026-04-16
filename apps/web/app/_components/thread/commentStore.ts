'use client';

import { create } from 'zustand';
import type { Comment } from '@gramola/db';

interface CommentsByPost {
  [postId: string]: Comment[];
}

interface CommentState {
  byPost: CommentsByPost;
  /** Replace the comment list for a post (used by RSC hydration). */
  set(postId: string, comments: Comment[]): void;
  /** Append a comment, idempotent on id. */
  add(comment: Comment): void;
}

export const useCommentStore = create<CommentState>((set) => ({
  byPost: {},
  set: (postId, comments) =>
    set((s) => ({ byPost: { ...s.byPost, [postId]: dedupe(comments) } })),
  add: (c) =>
    set((s) => {
      const current = s.byPost[c.postId] ?? [];
      if (current.some((x) => x.id === c.id)) return s;
      return {
        byPost: { ...s.byPost, [c.postId]: [...current, c] },
      };
    }),
}));

function dedupe(list: Comment[]): Comment[] {
  const seen = new Set<string>();
  const out: Comment[] = [];
  for (const c of list) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}
