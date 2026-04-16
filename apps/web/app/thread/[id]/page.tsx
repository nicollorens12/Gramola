import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { rowToPost, rowToComment } from '@/lib/posts';
import { postToTrack } from '@gramola/db';
import { ThreadHeader } from '@/app/_components/thread/ThreadHeader';
import { CommentList } from '@/app/_components/thread/CommentList';
import { CommentComposer } from '@/app/_components/thread/CommentComposer';
import { CommentLiveBridge } from '@/app/_components/thread/CommentLiveBridge';
import { ThreadAutoplay } from '@/app/_components/player/ThreadAutoplay';

interface ThreadPageProps {
  params: Promise<{ id: string }>;
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const [{ data: postRow }, { data: commentRows }] = await Promise.all([
    supabase
      .from('posts')
      .select(
        'id, title, comment, source_url, provider, thumbnail_url, artist, duration_seconds, youtube_id, embed_html, playback_strategy, created_at',
      )
      .eq('id', id)
      .single(),
    supabase
      .from('comments')
      .select('id, post_id, handle, body, created_at')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .limit(500),
  ]);

  if (!postRow) notFound();

  const post = rowToPost(postRow);
  const comments = (commentRows ?? []).map(rowToComment);

  return (
    <article className="flex flex-col gap-6 pb-8">
      <ThreadAutoplay track={postToTrack(post)} />
      <ThreadHeader post={post} />
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-widest text-ink-mid">Comments</h2>
        <CommentComposer postId={post.id} />
        <CommentList postId={post.id} initialComments={comments} />
        <CommentLiveBridge postId={post.id} />
      </section>
    </article>
  );
}

export async function generateMetadata({ params }: ThreadPageProps) {
  const { id } = await params;
  const supabase = await supabaseServer();
  // Asserted shape: supabase-js's generic inference through the narrowed select
  // column list doesn't flow cleanly through our Database generic in some cases,
  // so we pin the shape here explicitly. Runtime is unchanged.
  const { data } = (await supabase
    .from('posts')
    .select('title, artist')
    .eq('id', id)
    .maybeSingle()) as { data: { title: string; artist: string | null } | null };
  if (!data) return { title: 'Thread' };
  const suffix = data.artist ? ` — ${data.artist}` : '';
  return { title: `${data.title}${suffix}` };
}
