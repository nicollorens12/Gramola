import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/identity/session';
import {
  HANDLE_REGEX,
  generateHandle,
  isValidHandle,
} from '@/lib/identity/handleGenerator';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET — return the current visitor's identity.
 *
 * Middleware normally sets the cookie on first page load, but on the very first
 * request that cookie isn't yet visible to downstream handlers (it lives on the
 * OUTGOING response, not the incoming request). So this endpoint is also
 * self-healing: if no session exists, we mint one right here.
 *
 * Also lazily upserts an `identities` row for rate-limit + rename tracking.
 */
export async function GET() {
  const session = await getSession();
  if (!session.identityId || !session.handle) {
    session.identityId = crypto.randomUUID();
    session.handle = generateHandle();
    await session.save();
  }

  await supabaseAdmin()
    .from('identities')
    .upsert(
      {
        id: session.identityId,
        handle: session.handle,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  return NextResponse.json({ id: session.identityId, handle: session.handle });
}

const PatchBody = z.object({
  handle: z.string().regex(HANDLE_REGEX, 'Handle must be 3–32 chars, letters/digits/-/_ only.'),
});

/**
 * PATCH — rename. Validates client-side format, updates identities row,
 * rotates the cookie with the new handle.
 */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session.identityId) {
    return NextResponse.json({ error: 'no_identity' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_handle', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const handle = parsed.data.handle;
  if (!isValidHandle(handle)) {
    return NextResponse.json({ error: 'invalid_handle' }, { status: 400 });
  }

  const db = supabaseAdmin();
  // Ensure a row exists (first-time renamers may not have commented yet).
  await db.from('identities').upsert(
    { id: session.identityId, handle },
    { onConflict: 'id' },
  );
  await db
    .from('identities')
    .update({
      handle,
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', session.identityId);

  session.handle = handle;
  await session.save();

  return NextResponse.json({ id: session.identityId, handle });
}
