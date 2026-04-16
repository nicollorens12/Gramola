import { supabaseServer } from '@/lib/supabase/server';
import { rowToPost } from '@/lib/posts';
import { FeedList } from '@/app/_components/feed/FeedList';
import { FeedLiveBridge } from '@/app/_components/feed/FeedLiveBridge';
import { AutoplayBootstrap } from '@/app/_components/player/AutoplayBootstrap';
import { postToTrack } from '@gramola/db';

export const revalidate = 0; // always fresh; we also stream updates via Realtime

export default async function HomePage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('posts')
    .select(
      'id, title, comment, source_url, provider, thumbnail_url, artist, duration_seconds, youtube_id, embed_html, playback_strategy, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(50);

  const posts = (data ?? []).map(rowToPost);
  const newest = posts[0];

  return (
    <div className="pb-8">
      {newest ? <AutoplayBootstrap track={postToTrack(newest)} /> : null}
      <FeedList initialPosts={posts} />
      <FeedLiveBridge />
    </div>
  );
}
