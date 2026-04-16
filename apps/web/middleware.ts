import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { generateHandle } from '@/lib/identity/handleGenerator';
import { sessionOptions, type SessionData } from '@/lib/identity/session';

/**
 * Bootstrap identity cookie on first request. We do this in middleware (not an
 * API route) so RSC renders on the very first visit already have a valid
 * `identityId` + `handle`, avoiding a flash of "anonymous" state.
 *
 * iron-session accepts a NextRequest + NextResponse pair and mutates both.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<Partial<SessionData>>(req, res, sessionOptions());

  if (!session.identityId || !session.handle) {
    session.identityId = crypto.randomUUID();
    session.handle = generateHandle();
    await session.save();
  }

  return res;
}

export const config = {
  matcher: [
    // Run on page requests and route handlers, but skip Next's internals and static files.
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)',
  ],
};
