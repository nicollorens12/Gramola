import { NextResponse } from 'next/server';
import {
  IngestPayloadSchema,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  VerifyError,
  verify,
} from '@gramola/ingest-protocol';
import { serverEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Bot → web ingest endpoint.
 *
 * Security:
 *   - HMAC over `timestamp.rawBody` with 5-min replay window.
 *   - Headers read from the raw Request; body is read as text BEFORE JSON.parse
 *     so the signed bytes match exactly.
 *   - Schema validated with zod after HMAC succeeds.
 *
 * Idempotency:
 *   - INSERT with a unique key on `wa_message_id`; on conflict we return the
 *     existing row's id with `{duplicate:true}`.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const env = serverEnv();

  try {
    verify(
      raw,
      {
        [TIMESTAMP_HEADER]: req.headers.get(TIMESTAMP_HEADER) ?? undefined,
        [SIGNATURE_HEADER]: req.headers.get(SIGNATURE_HEADER) ?? undefined,
      },
      env.INGEST_SECRET,
    );
  } catch (err) {
    if (err instanceof VerifyError) {
      return NextResponse.json({ error: err.code }, { status: 401 });
    }
    throw err;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = IngestPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const p = parsed.data;

  const db = supabaseAdmin();

  // Idempotency: try insert; if the unique wa_message_id constraint fires, look up the existing row.
  const { data: inserted, error: insertErr } = await db
    .from('posts')
    .insert({
      wa_message_id: p.waMessageId,
      wa_sender_hash: p.waSenderHash,
      title: p.title,
      comment: p.comment ?? null,
      source_url: p.sourceUrl ?? null,
      provider: p.provider,
      thumbnail_url: p.thumbnailUrl ?? null,
      artist: p.artist ?? null,
      duration_seconds: p.durationSeconds ?? null,
      youtube_id: p.youtubeId ?? null,
      embed_html: p.embedHtml ?? null,
      playback_strategy: p.playbackStrategy,
      metadata_raw: (p.metadataRaw ?? null) as never,
    })
    .select('id')
    .single();

  if (inserted) {
    return NextResponse.json({ id: inserted.id, duplicate: false }, { status: 201 });
  }

  // 23505 = unique_violation → lookup existing and return it with duplicate:true.
  if (insertErr?.code === '23505') {
    const { data: existing } = await db
      .from('posts')
      .select('id')
      .eq('wa_message_id', p.waMessageId)
      .single();
    if (existing) {
      return NextResponse.json({ id: existing.id, duplicate: true }, { status: 200 });
    }
  }

  return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
}
