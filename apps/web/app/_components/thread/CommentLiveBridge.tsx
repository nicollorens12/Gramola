'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { rowToComment } from '@/lib/posts';
import { useCommentStore } from './commentStore';
import type { Database } from '@gramola/db/types';

interface CommentLiveBridgeProps {
  postId: string;
}

/**
 * Subscribes to comments INSERT for this post and streams them into the store.
 * Realtime delivers every insert (ours + other browsers); the store is idempotent
 * on id so our optimistic add + Realtime echo don't double up.
 */
export function CommentLiveBridge({ postId }: CommentLiveBridgeProps) {
  const add = useCommentStore((s) => s.add);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`comments:${postId}`)
      .on<Database['public']['Tables']['comments']['Row']>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          add(rowToComment(row));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, add]);

  return null;
}
