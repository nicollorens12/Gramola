'use client';

import { create } from 'zustand';
import type { Post } from '@gramola/db';

interface FeedState {
  posts: Post[];
  set(posts: Post[]): void;
  prepend(post: Post): void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  set: (posts) => set({ posts: dedupe(posts) }),
  prepend: (post) =>
    set((s) =>
      s.posts.some((p) => p.id === post.id) ? s : { posts: [post, ...s.posts] },
    ),
}));

function dedupe(list: Post[]): Post[] {
  const seen = new Set<string>();
  const out: Post[] = [];
  for (const p of list) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}
