import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/identity/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { identityLimiter, ipLimiter } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

function getClientIp(req: Request): string {
  // Vercel sets x-forwarded-for with a comma-separated chain; first entry is the client.
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.identityId || !session.handle) {
    return NextResponse.json({ error: 'no_identity' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Identity + IP rate limits are independent — either tripping returns 429.
  const [idCheck, ipCheck] = await Promise.all([
    identityLimiter().check(session.identityId),
    ipLimiter().check(getClientIp(req)),
  ]);
  if (!idCheck.success || !ipCheck.success) {
    return NextResponse.json(
      { error: 'rate_limited' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Remaining-Identity': String(idCheck.remaining),
          'X-RateLimit-Remaining-IP': String(ipCheck.remaining),
        },
      },
    );
  }

  const db = supabaseAdmin();

  // Ensure the identities row exists and bump last_seen_at. Not strictly required
  // for the insert to succeed (identity_id is a free-form text), but keeps server
  // state honest for any future renames / analytics.
  await db.from('identities').upsert(
    {
      id: session.identityId,
      handle: session.handle,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  const { data, error } = await db
    .from('comments')
    .insert({
      post_id: parsed.data.postId,
      handle: session.handle,
      identity_id: session.identityId,
      body: parsed.data.body,
    })
    .select('id, post_id, handle, body, created_at')
    .single();

  if (error) {
    if (error.code === '23503') {
      return NextResponse.json({ error: 'post_not_found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    postId: data.post_id,
    handle: data.handle,
    body: data.body,
    createdAt: data.created_at,
  });
}
