'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { rowToPost } from '@/lib/posts';
import { useFeedStore } from './feedStore';
import type { Database } from '@gramola/db/types';

/**
 * Subscribes to posts INSERTs and prepends them to the feed store. The store
 * dedupes by id so we're safe if RSC and Realtime briefly overlap.
 */
export function FeedLiveBridge() {
  const prepend = useFeedStore((s) => s.prepend);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel('posts:feed')
      .on<Database['public']['Tables']['posts']['Row']>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          if (!payload.new) return;
          prepend(rowToPost(payload.new));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [prepend]);

  return null;
}
