import { createHash } from 'node:crypto';
import { resolveMetadata, parseYouTubeId } from '@gramola/link-metadata';
import { parseCommand } from './parseCommand';
import { resolveYouTubeId } from './resolveYouTubeId';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { serverEnv } from '@/lib/env';

/**
 * Process a single WhatsApp message from a Meta Cloud API webhook.
 * If the message starts with `!`, resolve metadata and create a post.
 * This runs in the background (via `after()`) so the webhook responds 200 fast.
 */
export async function processWhatsAppMessage(msg: {
  id: string;
  from: string;
  body: string;
  timestamp: string;
}): Promise<void> {
  const body = msg.body.trim();
  if (!body.startsWith('!')) return;

  const parsed = parseCommand(body.slice(1));
  if (!parsed.link && !parsed.title) return;

  const env = serverEnv();
  const senderHash = createHash('sha256')
    .update(`${msg.from}|webhook`)
    .digest('hex')
    .slice(0, 32);

  // Title-only case (no link).
  if (!parsed.link) {
    await insertPost({
      waMessageId: msg.id,
      waSenderHash: senderHash,
      title: parsed.title!.slice(0, 500),
      comment: parsed.comment ?? null,
    });
    return;
  }

  // Link case — resolve metadata + optional YouTube.
  const meta = await resolveMetadata(parsed.link);

  let youtubeId = meta.youtubeId ?? parseYouTubeId(parsed.link) ?? null;
  if (!youtubeId && (meta.provider === 'spotify' || meta.provider === 'apple_music')) {
    youtubeId = await resolveYouTubeId(
      { artist: meta.artist, title: meta.title },
      env.YOUTUBE_API_KEY,
    );
  }

  const embedHtml = meta.embedHtml ?? null;
  const playbackStrategy = youtubeId
    ? 'youtube'
    : embedHtml
      ? 'source_embed'
      : 'none';

  await insertPost({
    waMessageId: msg.id,
    waSenderHash: senderHash,
    title: meta.title.slice(0, 500),
    comment: parsed.comment ?? null,
    sourceUrl: parsed.link,
    provider: meta.provider,
    thumbnailUrl: meta.thumbnailUrl ?? null,
    artist: meta.artist ?? null,
    durationSeconds: meta.durationSeconds ?? null,
    youtubeId,
    embedHtml,
    playbackStrategy,
    metadataRaw: (meta.raw as Record<string, unknown> | null | undefined) ?? null,
  });
}

async function insertPost(post: {
  waMessageId: string;
  waSenderHash: string;
  title: string;
  comment?: string | null;
  sourceUrl?: string | null;
  provider?: string;
  thumbnailUrl?: string | null;
  artist?: string | null;
  durationSeconds?: number | null;
  youtubeId?: string | null;
  embedHtml?: string | null;
  playbackStrategy?: string;
  metadataRaw?: Record<string, unknown> | null;
}) {
  const db = supabaseAdmin();
  const { error } = await db.from('posts').insert({
    wa_message_id: post.waMessageId,
    wa_sender_hash: post.waSenderHash,
    title: post.title,
    comment: post.comment ?? null,
    source_url: post.sourceUrl ?? null,
    provider: (post.provider ?? 'none') as 'none',
    thumbnail_url: post.thumbnailUrl ?? null,
    artist: post.artist ?? null,
    duration_seconds: post.durationSeconds ?? null,
    youtube_id: post.youtubeId ?? null,
    embed_html: post.embedHtml ?? null,
    playback_strategy: (post.playbackStrategy ?? 'none') as 'none',
    metadata_raw: (post.metadataRaw ?? null) as never,
  });

  if (error) {
    // 23505 = unique_violation on wa_message_id — duplicate, safe to ignore.
    if (error.code === '23505') {
      console.info('[webhook] duplicate message, skipping:', post.waMessageId);
    } else {
      console.error('[webhook] insert failed:', error);
    }
  } else {
    console.info('[webhook] post created:', post.title);
  }
}
