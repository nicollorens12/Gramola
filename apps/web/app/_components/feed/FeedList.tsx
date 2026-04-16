'use client';

import { useEffect } from 'react';
import type { Post } from '@gramola/db';
import { useFeedStore } from './feedStore';
import { PostCard } from './PostCard';

interface FeedListProps {
  initialPosts: Post[];
}

export function FeedList({ initialPosts }: FeedListProps) {
  const setPosts = useFeedStore((s) => s.set);
  const posts = useFeedStore((s) => s.posts);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts, setPosts]);

  const list = posts.length ? posts : initialPosts;

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center text-ink-mid">
        <p className="font-display text-2xl text-ink-high">Quiet in here.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {list.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
